import {
  IsEmail,
  Matches,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  otpCode!: string;
}
