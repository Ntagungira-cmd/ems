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

  @ApiProperty({ example: 'EMP001' })
  @IsString()
  @MinLength(4)
  employeeIdentifier: string;

  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  phoneNumber: string;
}

// src/modules/employees/dto/update-employee.dto.ts
import { PartialType } from '@nestjs/swagger';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
