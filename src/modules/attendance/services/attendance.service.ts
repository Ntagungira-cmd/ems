import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from '../entities/attendance.entity';
import { endOfDay, startOfDay } from 'date-fns';
import { EmployeesService } from 'src/modules/employee/services/employee.service';
import { RecordAttendanceDto } from '../dto/attendance.dto';
import { MailQueue } from 'src/queues/mail.queue';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private employeesService: EmployeesService,
    private mailQueue: MailQueue,
  ) {}

  async recordAttendance(
    recordAttendanceDto: RecordAttendanceDto,
  ): Promise<Attendance> {
    const { employeeId, checkOut } = recordAttendanceDto;
    const employee = await this.employeesService.findOne(employeeId);

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // If checkOut is provided, find the latest incomplete attendance record
    if (checkOut) {
      const latestAttendance = await this.attendanceRepository.findOne({
        where: {
          employee: { id: employeeId },
          isComplete: false,
        },
        order: { checkIn: 'DESC' },
      });

      if (!latestAttendance) {
        throw new BadRequestException(
          'No active check-in found for this employee',
        );
      }

      latestAttendance.checkOut = checkOut;
      latestAttendance.isComplete = true;
      const savedAttendance =
        await this.attendanceRepository.save(latestAttendance);

      // Queue email notification
      await this.mailQueue.add('attendance-checkout', {
        employee,
        attendance: savedAttendance,
      });

      return savedAttendance;
    }

    // Check if employee already has an active attendance record
    const existingAttendance = await this.getActiveAttendance(employeeId);
    if (existingAttendance) {
      throw new BadRequestException('Employee already checked in');
    }

    // Create new attendance record
    const attendance = this.attendanceRepository.create({
      employee,
      checkIn: new Date(),
      isComplete: false,
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);

    // Queue email notification
    await this.mailQueue.add('attendance-checkin', {
      employee,
      attendance: savedAttendance,
    });

    return savedAttendance;
  }

  async getActiveAttendance(employeeId: string): Promise<Attendance | null> {
    return this.attendanceRepository.findOne({
      where: {
        employee: { id: employeeId },
        isComplete: false,
      },
    });
  }

  async getDailyAttendance(date: Date = new Date()): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: {
        date: Between(startOfDay(date), endOfDay(date)),
      },
      relations: ['employee'],
    });
  }
}
