import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RecordAttendanceDto } from '../dto/attendance.dto';
import { Attendance } from '../entities/attendance.entity';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('record')
  @ApiOperation({ summary: 'Record attendance (check-in/check-out)' })
  @ApiResponse({
    status: 201,
    description: 'Attendance recorded successfully',
    type: Attendance,
  })
  async recordAttendance(@Body() recordAttendanceDto: RecordAttendanceDto) {
    return this.attendanceService.recordAttendance(recordAttendanceDto);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily attendance records' })
  @ApiResponse({ status: 200, description: 'Returns daily attendance records' })
  async getDailyAttendance(@Query('date') date?: string) {
    const queryDate = date ? new Date(date) : new Date();
    return this.attendanceService.getDailyAttendance(queryDate);
  }
}
