import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersSchema } from './schema/users.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Users',
        schema: UsersSchema,
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
