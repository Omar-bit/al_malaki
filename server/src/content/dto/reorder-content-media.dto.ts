import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/** New display order for a slot, as a list of media ids. */
export class ReorderContentMediaDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
