import { IsString, IsEmail, IsPhoneNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  phoneNumber: string;
}

import { PartialType } from '@nestjs/swagger';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
