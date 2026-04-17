import { IsEmail } from 'class-validator';

export class RequestRegisterOtpDto {
  @IsEmail()
  email!: string;
}
