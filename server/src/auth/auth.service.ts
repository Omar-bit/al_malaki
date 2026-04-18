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
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';

export interface RequestRegisterOtpResponse {
  message: string;
  expiresInSeconds: number;
}

export interface RegisterResponse {
  message: string;
  expiresInSeconds: number;
}

export interface AuthenticatedUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  verifiedEmail: boolean;
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
      include: {
        registerOtp: true,
      },
    });

    if (!existingUser) {
      throw new UnauthorizedException(
        'No pending registration found for this email. Please sign up first',
      );
    }

    if (existingUser.verifiedEmail) {
      throw new ConflictException(
        'This account is already verified. Please log in',
      );
    }

    const expiresInSeconds = await this.createOrRefreshRegisterOtp(
      normalizedEmail,
      existingUser.id,
    );

    this.logger.log(
      `Registration OTP generated and emailed to ${normalizedEmail}`,
    );

    return {
      message: 'OTP code sent successfully',
      expiresInSeconds,
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const normalizedEmail = this.normalizeEmail(registerDto.email);

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        registerOtp: true,
      },
    });

    const passwordHash = await hash(registerDto.password, 12);

    let userId: string;

    if (existingUser) {
      if (existingUser.verifiedEmail) {
        throw new ConflictException('A user with this email already exists');
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          passwordHash,
          role: 'CUSTOMER',
          verifiedEmail: false,
        },
      });

      userId = updatedUser.id;
    } else {
      const createdUser = await this.prismaService.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: 'CUSTOMER',
          verifiedEmail: false,
        },
      });

      userId = createdUser.id;
    }

    const expiresInSeconds = await this.createOrRefreshRegisterOtp(
      normalizedEmail,
      userId,
    );

    return {
      message: 'Registration completed. Please verify your email with the OTP',
      expiresInSeconds,
    };
  }

  async verifyRegisterOtp(
    verifyRegisterOtpDto: VerifyRegisterOtpDto,
  ): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(verifyRegisterOtpDto.email);

    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        registerOtp: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No account found for this email. Please sign up first',
      );
    }

    if (user.verifiedEmail) {
      throw new ConflictException(
        'This account is already verified. Please log in',
      );
    }

    if (!user.registerOtp) {
      throw new UnauthorizedException(
        'No OTP found for this email. Please request a new code',
      );
    }

    const otpId = await this.verifyRegisterOtpCode(
      normalizedEmail,
      verifyRegisterOtpDto.otpCode,
    );

    const [, activatedUser] = await this.prismaService.$transaction([
      this.prismaService.registerOtp.delete({
        where: { id: otpId },
      }),
      this.prismaService.user.update({
        where: { id: user.id },
        data: { verifiedEmail: true },
      }),
    ]);

    return {
      user: this.mapUser(activatedUser),
      token: await this.createAccessToken(
        activatedUser.id,
        activatedUser.email,
      ),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(loginDto.email);

    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        registerOtp: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.verifiedEmail) {
      throw new HttpException(
        {
          message:
            'Your account is not activated yet. Please verify your email OTP',
          code: 'EMAIL_NOT_VERIFIED',
        },
        HttpStatus.FORBIDDEN,
      );
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

  private async verifyRegisterOtpCode(
    email: string,
    otpCode: string,
  ): Promise<string> {
    const pendingOtp = await this.prismaService.registerOtp.findUnique({
      where: { email },
    });

    if (!pendingOtp) {
      throw new UnauthorizedException(
        'No OTP found for this email. Please request a new code',
      );
    }

    if (pendingOtp.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        'OTP has expired. Please request a new code',
      );
    }

    if (pendingOtp.attemptsRemaining <= 0) {
      throw new HttpException(
        'Too many invalid OTP attempts. Please request a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isOtpValid = await compare(otpCode, pendingOtp.otpHash);

    if (!isOtpValid) {
      const nextAttemptsRemaining = Math.max(
        pendingOtp.attemptsRemaining - 1,
        0,
      );

      await this.prismaService.registerOtp.update({
        where: { email },
        data: {
          attemptsRemaining: nextAttemptsRemaining,
        },
      });

      if (nextAttemptsRemaining <= 0) {
        throw new HttpException(
          'Too many invalid OTP attempts. Please request a new code',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException('Invalid OTP code');
    }

    return pendingOtp.id;
  }

  private async createOrRefreshRegisterOtp(
    email: string,
    userId: string,
  ): Promise<number> {
    const otpCode = randomInt(100000, 1000000).toString();
    const otpHash = await hash(otpCode, 10);
    const expiresInSeconds = this.getRegisterOtpTtlInSeconds();

    await this.mailService.sendOtpEmail({
      to: email,
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
      where: { email },
      create: {
        email,
        userId,
        otpHash,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        attemptsRemaining: this.getRegisterOtpMaxAttempts(),
      },
      update: {
        userId,
        otpHash,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        attemptsRemaining: this.getRegisterOtpMaxAttempts(),
      },
    });

    return expiresInSeconds;
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
      verifiedEmail: user.verifiedEmail,
      createdAt: user.createdAt,
    };
  }
}
