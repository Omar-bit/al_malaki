import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  DEFAULT_JWT_EXPIRES_IN_SECONDS,
  DEFAULT_JWT_SECRET,
} from './constants/auth.constants';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_ACCESS_SECRET') ?? DEFAULT_JWT_SECRET,
        signOptions: {
          expiresIn:
            Number(
              configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS'),
            ) || DEFAULT_JWT_EXPIRES_IN_SECONDS,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
