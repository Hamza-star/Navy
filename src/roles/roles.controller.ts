import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async createRole(@Body('name') name: string) {
    const role = await this.rolesService.createRole(name);
    return {
      message: 'Role created successfully',
      data: role,
    };
  }

  @Get()
  async getAllRoles() {
    const roles = await this.rolesService.getAllRoles();
    return {
      message: 'All roles retrieved successfully',
      data: roles,
    };
  }

  @Put(':id')
  async updateRole(@Param('id') id: string, @Body('name') name: string) {
    return await this.rolesService.getRoleByIdAndUpdate(id, name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteRole(@Param('id') id: string) {
    return await this.rolesService.getRoleByIdAndDelete(id);
  }
}
