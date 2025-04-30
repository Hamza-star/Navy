import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roles, RolesDocument } from './schema/roles.schema';
import { UsersDocument } from 'src/users/schema/users.schema';
@Injectable()
export class RolesService {
  constructor(
    @InjectModel('Roles')
    private readonly rolesModel: Model<RolesDocument>,
    @InjectModel('Users')
    private readonly usersModel: Model<UsersDocument>,
  ) {}

  async createRole(name: string): Promise<Roles> {
    const newRole = new this.rolesModel({ name });
    return newRole.save();
  }

  async getAllRoles(): Promise<Roles[]> {
    return this.rolesModel.find().exec();
  }
  async getRoleByIdAndUpdate(
    id: string,
    name: string,
  ): Promise<{ message: string }> {
    const usersWithRole = await this.usersModel.countDocuments({ role: id });
    if (usersWithRole > 0) {
      throw new NotFoundException(
        `Cannot delete role. ${usersWithRole} user(s) are using this role.`,
      );
    }
    const role = await this.rolesModel
      .findByIdAndUpdate(id, { name }, { new: true })
      .exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return { message: 'Role updated successfully' };
  }
  async getRoleByIdAndDelete(id: string): Promise<{ message: string }> {
    await this.usersModel.updateMany({ role: id }, { $unset: { role: '' } });
    const privelleges = await this.rolesModel.findByIdAndDelete(id).exec();
    if (!privelleges) {
      throw new NotFoundException(`Roles with id ${id} not found`);
    }
    return { message: 'Roles deleted successfully' };
  }
}
