import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestRegisterOtp(
    @Body() requestRegisterOtpDto: RequestRegisterOtpDto,
  ) {
    return this.authService.requestRegisterOtp(requestRegisterOtpDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyRegisterOtp(
    @Body() verifyRegisterOtpDto: VerifyRegisterOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result =
      await this.authService.verifyRegisterOtp(verifyRegisterOtpDto);

    response.cookie(
      this.authService.getAuthCookieName(),
      result.token,
      this.authService.getAuthCookieOptions(),
    );

    return {
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    response.cookie(
      this.authService.getAuthCookieName(),
      result.token,
      this.authService.getAuthCookieOptions(),
    );

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(
      this.authService.getAuthCookieName(),
      this.authService.getClearCookieOptions(),
    );

    return {
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      user: await this.authService.getProfile(user.userId),
    };
  }
}
