import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.authguard';
import { AdminGuard } from '../auth/roles.authguard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('myprofile')
  getMyProfile(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = req.user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.usersService.findById(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('updatemyprofile')
  updateMyProfile(@Req() req: Request, @Body() updates: UpdateUserDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = req.user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.usersService.updateUser(user.userId, updates);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deletemyprofile')
  deleteMyAccount(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = req.user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.usersService.deleteUser(user.userId);
  }

  // Admin or internal routes
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('allUsers')
  findAllUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('fetch/:id')
  findUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('update/:id')
  updateUser(@Param('id') id: string, @Body() updates: Partial<any>) {
    return this.usersService.updateUser(id, updates);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('delete/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('updateRole/:id')
  updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UpdateUserDto['role'],
  ) {
    if (!role) {
      throw new BadRequestException('Role is required');
    }
    return this.usersService.updateUserRole(id, role);
  }
}
