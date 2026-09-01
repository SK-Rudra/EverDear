import {
  IsString,
  MaxLength,
} from 'class-validator';
import { LETTER_BODY_MAX_LENGTH } from '../letter.constants.js';

export class LetterContentDto {
  @IsString()
  @MaxLength(LETTER_BODY_MAX_LENGTH)
  body!: string;
}