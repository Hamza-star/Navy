import { IsString } from 'class-validator';

export class DashboardDto {
  @IsString()
  timestamp;
}
