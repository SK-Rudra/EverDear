import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  PUBLIC_WALL_DEFAULT_PAGE_SIZE,
  PUBLIC_WALL_MAX_PAGE_SIZE,
} from '../public-wall.constants.js';

export class ListPublicMessagesDto {
  @IsOptional()
  @IsUUID('4')
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_WALL_MAX_PAGE_SIZE)
  limit: number = PUBLIC_WALL_DEFAULT_PAGE_SIZE;
}