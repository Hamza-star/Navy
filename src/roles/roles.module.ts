import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesSchema } from './schema/roles.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Roles',
        schema: RolesSchema,
      },
    ]),
    UsersModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [MongooseModule],
})
export class RolesModule {}
