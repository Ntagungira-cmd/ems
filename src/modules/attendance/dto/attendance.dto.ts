import { IsNotEmpty, IsUUID, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordAttendanceDto {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @IsOptional()
  @IsDate()
  @ApiProperty({ required: false, description: 'Check-out time' })
  checkOut?: Date;
}
