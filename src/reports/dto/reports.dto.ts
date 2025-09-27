import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class ReportsDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  range?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  // ✅ Add these mandatory fields
  @IsString()
  @IsIn(['CHCT1', 'CHCT2', 'CT1', 'CT2'])
  towerType!: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';

  @IsString()
  @IsIn(['realtime', 'efficiency'])
  reportType!: 'realtime' | 'efficiency';
}
