import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body: string;
}
