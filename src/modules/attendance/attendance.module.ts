import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './services/attendance.service';
import { Attendance } from './entities/attendance.entity';
import { BullModule } from '@nestjs/bull';
import { EmployeesModule } from '../employee/employee.module';
import { AttendanceController } from './controllers/attendance.cotroller';
import { MailQueue } from 'src/queues/mail.queue';
import { QueuesModule } from 'src/queues/queues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    EmployeesModule,
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, MailQueue],
  exports: [AttendanceService],
})
export class AttendanceModule {}
