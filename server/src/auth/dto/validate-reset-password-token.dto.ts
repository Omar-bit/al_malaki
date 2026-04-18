import { IsString, MinLength } from 'class-validator';

export class ValidateResetPasswordTokenDto {
  @IsString()
  @MinLength(20)
  token!: string;
}
