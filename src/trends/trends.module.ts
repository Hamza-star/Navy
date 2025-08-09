import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrendsService } from './trends.service';
import { TrendsController } from './trends.controller';
import { trendsData, trendsSchema } from './schemas/trends.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: trendsData.name, schema: trendsSchema },
    ]), // ✅ No connection name, uses default
  ],
  controllers: [TrendsController],
  providers: [TrendsService],
})
export class TrendsModule {}
