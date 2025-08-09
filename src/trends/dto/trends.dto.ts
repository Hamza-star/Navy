// src/trends/dto/trends.dto.ts
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class TrendsBodyDto {
  @IsNotEmpty()
  @IsString()
  start_date: string;

  @IsNotEmpty()
  @IsString()
  end_date: string;

  @IsArray()
  @IsString({ each: true })
  meterIds: string[];  // Changed to array and plural name

  @IsArray()
  @IsString({ each: true })
  suffixes: string[];  // Changed to array

  @IsNotEmpty()
  @IsString()
  area: string;

  @IsNotEmpty()
  @IsString()
  LT_selections: string;
}