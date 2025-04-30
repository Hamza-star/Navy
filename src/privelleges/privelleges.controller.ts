import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { PrivellegesService } from './privelleges.service';
import { Privelleges } from './schema/privelleges.schema';
import { AddPrivellegesDto } from './dto/privelleges.dto';
import { UpdatePrivellegesDto } from './dto/privelleges.dto'; // Import update DTO

@Controller('privelleges')
export class PrivellegesController {
  constructor(private readonly privellegesService: PrivellegesService) {}

  // Add Privilege
  @Post()
  async addPrivelleges(@Body() dto: AddPrivellegesDto): Promise<Privelleges> {
    if (!dto.name) {
      throw new NotFoundException('Name is required');
    }
    return await this.privellegesService.createPrivelleges(dto.name);
  }

  // Get All Privileges
  @Get()
  async getAllPrivelleges(): Promise<Privelleges[]> {
    return this.privellegesService.getAllPrivelleges();
  }

  // Get Privilege by ID and Update
  @Put(':id')
  async updatePrivelleges(
    @Param('id') id: string,
    @Body() dto: UpdatePrivellegesDto,
  ): Promise<{ message: string }> {
    const { name } = dto;

    if (!name) {
      throw new NotFoundException('Name is required');
    }

    return await this.privellegesService.getPrivellegesByIdAndUpdate(id, name);
  }

  // Delete Privilege by ID
  @Delete(':id')
  async deletePrivelleges(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return await this.privellegesService.getPrivellegesByIdAndDelete(id);
  }
}
