import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../generated/prisma';
import { compare, hash } from 'bcryptjs';
import { CookieOptions } from 'express';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  DEFAULT_COOKIE_MAX_AGE_MS,
  DEFAULT_JWT_EXPIRES_IN_SECONDS,
  DEFAULT_JWT_SECRET,
} from './constants/auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';

export interface RequestRegisterOtpResponse {
  message: string;
  expiresInSeconds: number;
}

export interface AuthenticatedUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

export interface AuthResult {
  user: AuthenticatedUserResponse;
  token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async requestRegisterOtp(
    requestRegisterOtpDto: RequestRegisterOtpDto,
  ): Promise<RequestRegisterOtpResponse> {
    const normalizedEmail = this.normalizeEmail(requestRegisterOtpDto.email);

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const otpCode = randomInt(100000, 1000000).toString();
    const otpHash = await hash(otpCode, 10);
    const expiresInSeconds = this.getRegisterOtpTtlInSeconds();

    await this.mailService.sendOtpEmail({
      to: normalizedEmail,
      otpCode,
      expiresInMinutes: Math.ceil(expiresInSeconds / 60),
      subject:
        this.configService.get<string>('REGISTER_OTP_EMAIL_SUBJECT') ??
        'Your AL MALAKI verification code',
      template: {
        brandName:
          this.configService.get<string>('REGISTER_OTP_BRAND_NAME') ??
          'AL MALAKI',
        heading:
          this.configService.get<string>('REGISTER_OTP_EMAIL_HEADING') ??
          'Verify your email address',
        introText:
          this.configService.get<string>('REGISTER_OTP_EMAIL_INTRO') ??
          'Use the following one-time passcode to complete your registration.',
      },
    });

    await this.prismaService.registerOtp.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        otpHash,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        attemptsRemaining: this.getRegisterOtpMaxAttempts(),
      },
      update: {
        otpHash,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        attemptsRemaining: this.getRegisterOtpMaxAttempts(),
      },
    });

    this.logger.log(
      `Registration OTP generated and emailed to ${normalizedEmail}`,
    );

    return {
      message: 'OTP code sent successfully',
      expiresInSeconds,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(registerDto.email);

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    await this.verifyRegisterOtp(normalizedEmail, registerDto.otpCode);

    const passwordHash = await hash(registerDto.password, 12);

    const user = await this.prismaService.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'CUSTOMER',
      },
    });

    return {
      user: this.mapUser(user),
      token: await this.createAccessToken(user.id, user.email),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(loginDto.email);

    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: this.mapUser(user),
      token: await this.createAccessToken(user.id, user.email),
    };
  }

  async getProfile(userId: string): Promise<AuthenticatedUserResponse> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUser(user);
  }

  getAuthCookieName(): string {
    return AUTH_COOKIE_NAME;
  }

  getAuthCookieOptions(): CookieOptions {
    return buildAuthCookieOptions(this.isProduction(), this.getCookieMaxAge());
  }

  getClearCookieOptions(): CookieOptions {
    const { maxAge, ...cookieOptions } = this.getAuthCookieOptions();
    return cookieOptions;
  }

  getJwtSecret(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? DEFAULT_JWT_SECRET
    );
  }

  private async createAccessToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const expiresInSeconds =
      Number(this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS')) ||
      DEFAULT_JWT_EXPIRES_IN_SECONDS;

    return this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.getJwtSecret(),
        expiresIn: expiresInSeconds,
      },
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async verifyRegisterOtp(
    email: string,
    otpCode: string,
  ): Promise<void> {
    const pendingOtp = await this.prismaService.registerOtp.findUnique({
      where: { email },
    });

    if (!pendingOtp) {
      throw new UnauthorizedException(
        'No OTP found for this email. Please request a new code',
      );
    }

    if (pendingOtp.expiresAt.getTime() <= Date.now()) {
      await this.prismaService.registerOtp.delete({
        where: { email },
      });
      throw new UnauthorizedException(
        'OTP has expired. Please request a new code',
      );
    }

    if (pendingOtp.attemptsRemaining <= 0) {
      await this.prismaService.registerOtp.delete({
        where: { email },
      });
      throw new HttpException(
        'Too many invalid OTP attempts. Please request a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isOtpValid = await compare(otpCode, pendingOtp.otpHash);

    if (!isOtpValid) {
      const nextAttemptsRemaining = pendingOtp.attemptsRemaining - 1;

      if (nextAttemptsRemaining <= 0) {
        await this.prismaService.registerOtp.delete({
          where: { email },
        });
      } else {
        await this.prismaService.registerOtp.update({
          where: { email },
          data: {
            attemptsRemaining: nextAttemptsRemaining,
          },
        });
      }

      throw new UnauthorizedException('Invalid OTP code');
    }

    await this.prismaService.registerOtp.delete({
      where: { email },
    });
  }

  private getRegisterOtpTtlInSeconds(): number {
    const rawValue = this.configService.get<string>(
      'REGISTER_OTP_TTL_IN_SECONDS',
    );
    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 5 * 60;
    }

    return parsedValue;
  }

  private getRegisterOtpMaxAttempts(): number {
    const rawValue = this.configService.get<string>(
      'REGISTER_OTP_MAX_ATTEMPTS',
    );
    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 5;
    }

    return parsedValue;
  }

  private getCookieMaxAge(): number {
    const rawValue = this.configService.get<string>('JWT_COOKIE_MAX_AGE_MS');
    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return DEFAULT_COOKIE_MAX_AGE_MS;
    }

    return parsedValue;
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private mapUser(user: User): AuthenticatedUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    };
  }
}
