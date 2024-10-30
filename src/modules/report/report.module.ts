import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Attendance } from 'src/modules/attendance/entities/attendance.entity';
import { Employee } from 'src/modules/employee/entities/employee.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Employee]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
