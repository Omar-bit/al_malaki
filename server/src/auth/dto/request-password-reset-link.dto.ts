import { IsEmail } from 'class-validator';

export class RequestPasswordResetLinkDto {
  @IsEmail()
  email!: string;
}
