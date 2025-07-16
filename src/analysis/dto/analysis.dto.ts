import { IsNotEmpty, IsString } from 'class-validator';

export class AnalysisDto {
  @IsString()
  @IsNotEmpty()
  Tower: string;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;
}
