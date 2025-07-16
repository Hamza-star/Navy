import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PrivellegesModule } from './privelleges/privelleges.module';
import { NodeRedLinkModule } from './nodered/node_red_link.module';
import { meter_dataModule } from './meter_data/meter_data.module';
import { LogsDataModule } from './logs_data/logs_data.module';
import { ReportsModule } from './reports/report.module';
import { AnalysisService } from './analysis/analysis.service';
import { AnalysisController } from './analysis/analysis.controller';
import { AnalysisModule } from './analysis/analysis.module';
import { HelpersModule } from './helpers/helpers.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ifl-project-ifl',
    ),
    UsersModule,
    AuthModule,
    RolesModule,
    PrivellegesModule,
    NodeRedLinkModule,
    meter_dataModule,
    LogsDataModule,
    ReportsModule,
    AnalysisModule,
    HelpersModule,
    DashboardModule,
  ],
  controllers: [AppController, AnalysisController],
  providers: [AppService, AnalysisService],
})
export class AppModule {}
