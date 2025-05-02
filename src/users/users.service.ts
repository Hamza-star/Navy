/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schema/users.schema';
import { Roles, RolesDocument } from '../roles/schema/roles.schema';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  async registerUser(email: string, hashedPassword: string): Promise<Users> {
    const newUser = new this.userModel({ email, password: hashedPassword });
    return newUser.save();
  }
  constructor(
    @InjectModel(Users.name) private userModel: Model<UsersDocument>,
    @InjectModel(Roles.name) private readonly roleModel: Model<RolesDocument>,
  ) {}

  async addUser(
    name: string,
    email: string,
    password: string,
    roleName: string,
  ): Promise<Users> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Find role by name
    const role = await this.roleModel.findOne({ name: roleName });
    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    // Hash password
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const newUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
      role: role._id, // reference ObjectId
    });

    return newUser.save();
  }

  async findAll(): Promise<Users[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<Users> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateUser(id: string, updates: Partial<Users>): Promise<Users> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
  async updateUserRole(id: string, role: string): Promise<Users> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
  async deleteUser(_id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(_id).exec();
    if (!result) throw new NotFoundException('User not found');
  }
}
