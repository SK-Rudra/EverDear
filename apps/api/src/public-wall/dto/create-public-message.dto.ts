import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import {
  PUBLIC_LOCATION_MAX_LENGTH,
  PUBLIC_MESSAGE_MAX_LENGTH,
  PUBLIC_MESSAGE_MIN_LENGTH,
} from '../public-wall.constants.js';

export class CreatePublicMessageDto {
  @IsString()
  @Length(
    PUBLIC_MESSAGE_MIN_LENGTH,
    PUBLIC_MESSAGE_MAX_LENGTH,
  )
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(PUBLIC_LOCATION_MAX_LENGTH)
  displayLocation?: string;

  /*
   * Honeypot field. Real users never fill this.
   * Automated form bots often do.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}