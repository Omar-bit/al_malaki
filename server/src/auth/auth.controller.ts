import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetLinkDto } from './dto/request-password-reset-link.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestRegisterOtpDto } from './dto/request-register-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetPasswordTokenDto } from './dto/validate-reset-password-token.dto';
import { VerifyRegisterOtpDto } from './dto/verify-register-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './types/auth-user.type';

const profilePictureStorage = diskStorage({
  destination: './uploads/profiles',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

const profilePictureFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(
    new BadRequestException('Only image files are allowed (jpeg, png, webp, gif)'),
    false,
  );
};

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

  @Post('password/forgot')
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
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/upload-profile-picture')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: profilePictureStorage,
      fileFilter: profilePictureFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
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
