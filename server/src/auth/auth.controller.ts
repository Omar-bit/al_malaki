import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { createImageUploadOptions } from '../common/storage/upload-storage';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetLinkDto } from './dto/request-password-reset-link.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetPasswordTokenDto } from './dto/validate-reset-password-token.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './types/auth-user.type';

// Tight limits on abuse-prone auth flows (brute force, OTP guessing, email
// bombing). ttl is in milliseconds.
const STRICT_THROTTLE = { default: { limit: 5, ttl: 60_000 } };
const LOGIN_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/request-otp')
  @Throttle(STRICT_THROTTLE)
  @HttpCode(HttpStatus.OK)
  async requestRegisterOtp(
    @Body() requestRegisterOtpDto: RequestRegisterOtpDto,
  ) {
    return this.authService.requestRegisterOtp(requestRegisterOtpDto);
  }

  @Post('password/forgot')
  @Throttle(STRICT_THROTTLE)
  @HttpCode(HttpStatus.OK)
  async requestPasswordResetLink(
    @Body() requestPasswordResetLinkDto: RequestPasswordResetLinkDto,
  ) {
    return this.authService.requestPasswordResetLink(
      requestPasswordResetLinkDto,
    );
  }

  @Post('password/validate-token')
  @HttpCode(HttpStatus.OK)
  async validateResetPasswordToken(
    @Body() validateResetPasswordTokenDto: ValidateResetPasswordTokenDto,
  ) {
    return this.authService.validateResetPasswordToken(
      validateResetPasswordTokenDto,
    );
  }

  @Post('password/reset')
  @Throttle(LOGIN_THROTTLE)
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('register')
  @Throttle(STRICT_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/upload-profile-picture')
  @UseInterceptors(
    FileInterceptor('image', createImageUploadOptions('./uploads/profiles')),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return { url: `/uploads/profiles/${file.filename}` };
  }

  @Post('register/verify-otp')
  @Throttle(LOGIN_THROTTLE)
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
  @Throttle(LOGIN_THROTTLE)
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie(
      this.authService.getAuthCookieName(),
      this.authService.getClearCookieOptions(),
    );

    await this.authService.logLogout(user.userId);

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

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return {
      user: await this.authService.updateProfile(user.userId, updateProfileDto),
    };
  }
}
