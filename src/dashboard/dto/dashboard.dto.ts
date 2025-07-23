import { IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

export class DashboardDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  range?: string; // 'today', 'week', 'lastMonth', etc.

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string; // Format: 'HH:MM:SS'

  @IsOptional()
  @IsString()
  endTime?: string; // Format: 'HH:MM:SS'
}
