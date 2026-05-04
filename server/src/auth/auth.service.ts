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
import { createHash, randomInt } from 'crypto';
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
import { RequestPasswordResetLinkDto } from './dto/request-password-reset-link.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetPasswordTokenDto } from './dto/validate-reset-password-token.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';

export interface RequestRegisterOtpResponse {
  message: string;
  expiresInSeconds: number;
}

export interface RegisterResponse {
  message: string;
  expiresInSeconds: number;
}

export interface RequestPasswordResetLinkResponse {
  message: string;
}

export interface ValidateResetPasswordTokenResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface AuthenticatedUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;

  verifiedEmail: boolean;
  createdAt: Date;
}

export interface AuthResult {
  user: AuthenticatedUserResponse;
  token: string;
}

interface ResetPasswordTokenPayload {
  sub: string;
  email: string;
  type: 'password_reset';
  pwd: string;
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

  async requestPasswordResetLink(
    requestPasswordResetLinkDto: RequestPasswordResetLinkDto,
  ): Promise<RequestPasswordResetLinkResponse> {
    const normalizedEmail = this.normalizeEmail(
      requestPasswordResetLinkDto.email,
    );

    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user?.verifiedEmail) {
      const resetToken = await this.createResetPasswordToken(user);
      await this.sendResetPasswordEmail(normalizedEmail, resetToken);

      this.logger.log(`Reset-password link emailed to ${normalizedEmail}`);
    }

    return {
      message:
        'If an account exists for this email, a password reset link has been sent',
    };
  }

  async validateResetPasswordToken(
    validateResetPasswordTokenDto: ValidateResetPasswordTokenDto,
  ): Promise<ValidateResetPasswordTokenResponse> {
    await this.validateResetPasswordTokenOrThrow(
      validateResetPasswordTokenDto.token,
    );

    return {
      message: 'Reset link is valid',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponse> {
    const user = await this.validateResetPasswordTokenOrThrow(
      resetPasswordDto.token,
    );

    const nextPasswordHash = await hash(resetPasswordDto.newPassword, 12);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { passwordHash: nextPasswordHash },
    });

    return {
      message: 'Password reset successful. You can now log in',
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const normalizedEmail = this.normalizeEmail(registerDto.email);
    const normalizedFirstName = this.normalizeName(registerDto.firstName);
    const normalizedLastName = this.normalizeName(registerDto.lastName);
    const normalizedPhoneNumber = this.normalizePhoneNumber(
      registerDto.phoneNumber,
    );

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
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          phoneNumber: normalizedPhoneNumber,
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
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          phoneNumber: normalizedPhoneNumber,
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

  private normalizeName(name: string): string {
    return name.trim();
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.trim();
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

  private async createResetPasswordToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: 'password_reset',
        pwd: this.buildPasswordFingerprint(user.passwordHash),
      },
      {
        secret: this.getResetPasswordTokenSecret(),
        expiresIn: this.getResetPasswordTokenExpiresInSeconds(),
      },
    );
  }

  private async validateResetPasswordTokenOrThrow(
    token: string,
  ): Promise<User> {
    try {
      const payload =
        await this.jwtService.verifyAsync<ResetPasswordTokenPayload>(token, {
          secret: this.getResetPasswordTokenSecret(),
        });

      if (
        !payload?.sub ||
        !payload?.email ||
        payload.type !== 'password_reset'
      ) {
        throw new UnauthorizedException('Invalid or expired reset link');
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.verifiedEmail) {
        throw new UnauthorizedException('Invalid or expired reset link');
      }

      if (
        this.normalizeEmail(user.email) !== this.normalizeEmail(payload.email)
      ) {
        throw new UnauthorizedException('Invalid or expired reset link');
      }

      if (this.buildPasswordFingerprint(user.passwordHash) !== payload.pwd) {
        throw new UnauthorizedException('Invalid or expired reset link');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired reset link');
    }
  }

  private async sendResetPasswordEmail(
    email: string,
    token: string,
  ): Promise<void> {
    const resetUrl = this.buildResetPasswordUrl(token);

    await this.mailService.sendEmail({
      to: email,
      subject:
        this.configService.get<string>('RESET_PASSWORD_EMAIL_SUBJECT') ??
        'Reset your AL MALAKI password',
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `
        <div style="margin:0;padding:24px;background:#f6efe3;font-family:Georgia,'Times New Roman',serif;color:#3f060f;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ead8bf;">
            <tr>
              <td style="padding:28px 28px 16px;background:linear-gradient(120deg,#f8ecd8,#e8d4b5);text-align:center;">
                <p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7d5645;">AL MALAKI</p>
                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;color:#3f060f;">Reset your password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#5a3b33;">Click the button below to create a new password for your account.</p>
                <div style="text-align:center;padding:14px 0 6px;">
                  <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;border-radius:9999px;background:#3f060f;color:#fdf8f0;text-decoration:none;font-weight:700;">Reset Password</a>
                </div>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#7a5b4f;text-align:center;">If you did not request this, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </div>
      `,
    });
  }

  private buildResetPasswordUrl(token: string): string {
    const baseUrl = this.getResetPasswordClientUrl();
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  private getResetPasswordClientUrl(): string {
    const configuredUrl = this.configService
      .get<string>('CLIENT_RESET_PASSWORD_URL')
      ?.trim();

    if (configuredUrl) {
      return configuredUrl;
    }

    const clientOrigin =
      this.configService.get<string>('CLIENT_ORIGIN') ??
      'http://localhost:5173';
    const firstOrigin =
      clientOrigin.split(',')[0]?.trim() || 'http://localhost:5173';
    return `${firstOrigin.replace(/\/+$/, '')}/reset-password`;
  }

  private getResetPasswordTokenSecret(): string {
    return (
      this.configService.get<string>('RESET_PASSWORD_TOKEN_SECRET') ??
      this.getJwtSecret()
    );
  }

  private getResetPasswordTokenExpiresInSeconds(): number {
    const rawValue = this.configService.get<string>(
      'RESET_PASSWORD_TOKEN_EXPIRES_IN_SECONDS',
    );
    const parsedValue = Number(rawValue);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 15 * 60;
    }

    return parsedValue;
  }

  private buildPasswordFingerprint(passwordHash: string): string {
    return createHash('sha256').update(passwordHash).digest('hex').slice(0, 32);
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
      phoneNumber: user.phoneNumber,
      verifiedEmail: user.verifiedEmail,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
