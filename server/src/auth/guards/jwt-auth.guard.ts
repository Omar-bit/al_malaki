import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  AUTH_COOKIE_NAME,
  DEFAULT_JWT_SECRET,
} from '../constants/auth.constants';
import { AuthenticatedRequest } from '../types/authenticated-request.type';
import { JwtPayload } from '../types/jwt-payload.type';

type RequestWithCookies = AuthenticatedRequest &
  Request & {
    cookies?: Record<string, string>;
  };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const token = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          DEFAULT_JWT_SECRET,
      });

      request.user = {
        userId: payload.sub,
        email: payload.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
