import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyRegisterOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  otpCode!: string;
}
