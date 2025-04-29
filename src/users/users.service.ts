import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from './schema/users.schema';

@Injectable()
export class UsersService {
  async registerUser(email: string, hashedPassword: string): Promise<Users> {
    const newUser = new this.userModel({ email, password: hashedPassword });
    return newUser.save();
  }
  constructor(
    @InjectModel(Users.name) private userModel: Model<UsersDocument>,
  ) {}

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
