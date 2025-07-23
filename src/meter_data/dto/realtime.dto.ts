// src/meter_data/dto/realtime.dto.ts
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RealtimeDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['Chillers', 'Process'])
  area: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['CHCT1', 'CHCT2', 'CT1', 'CT2'])
  U_selections: string;
}
