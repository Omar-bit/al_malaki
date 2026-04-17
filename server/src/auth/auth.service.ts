import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../generated/prisma';
import { compare, hash } from 'bcryptjs';
import { CookieOptions } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  DEFAULT_COOKIE_MAX_AGE_MS,
  DEFAULT_JWT_EXPIRES_IN_SECONDS,
  DEFAULT_JWT_SECRET,
} from './constants/auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(registerDto.email);

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

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
