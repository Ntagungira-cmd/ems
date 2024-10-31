import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AttendanceService } from 'src/modules/attendance/services/attendance.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserRole } from 'src/common/enums/role.enum';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { AuthService } from 'src/modules/auth/services/auth.service';

describe('AttendanceController (e2e)', () => {
  let app: INestApplication;
  let attendanceService: AttendanceService;
  let authService: AuthService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));
    await app.init();

    attendanceService = moduleFixture.get<AttendanceService>(AttendanceService);
    authService = moduleFixture.get<AuthService>(AuthService);

    const loginResponse = await authService.login({
      email: 'r.ntagungir@alustudent.com',
      password: 'Test@123', 
    });
    token = loginResponse.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /attendance/record', () => {
    it('should record attendance successfully', async () => {
      const recordAttendanceDto = {
        employeeId: 'db61301f-0219-481a-b067-fad4547c4040',
        checkIn: new Date(),
        checkOut: null,
      };

      jest.spyOn(attendanceService, 'recordAttendance').mockResolvedValue({
        id: 'attendance-id',
        employee: {
          id: 'db61301f-0219-481a-b067-fad4547c4040',
          email: 'ntagungiraali@gmail.com',
          firstName: 'Ali',
          lastName: 'Rashid',
          phoneNumber: '0781111111',
          password: 'qeqerqrew',
          passwordResetToken: null,
          passwordResetExpires: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: UserRole.USER,
          isActive: true,
        },
        date: new Date(),
        checkIn: recordAttendanceDto.checkIn,
        checkOut: null,
        isComplete: false,
      });

      return request(app.getHttpServer())
        .post('/attendance/record')
        .set('Authorization', `Bearer ${token}`) 
        .send(recordAttendanceDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.employee.id).toBe(recordAttendanceDto.employeeId);
          expect(res.body.checkIn).toBe(
            recordAttendanceDto.checkIn.toISOString(),
          );
        });
    });

    it('should return 400 for invalid attendance data', async () => {
      const invalidRecordAttendanceDto = {
        employeeId: '',
        checkIn: null,
      };
      jest.spyOn(attendanceService, 'recordAttendance').mockImplementation(
        async () => {
          throw new BadRequestException();
        },
      );

      return request(app.getHttpServer())
        .post('/attendance/record')
        .set('Authorization', `Bearer ${token}`) 
        .send(invalidRecordAttendanceDto)
        .expect(400);
    });
  });

  describe('GET /attendance/daily', () => {
    it('should return daily attendance records', async () => {
      const queryDate = new Date().toISOString().split('T')[0];

      // Mock the attendance service
      jest.spyOn(attendanceService, 'getDailyAttendance').mockResolvedValue([
        {
          id: 'attendance-id',
          employee: {
            id: 'db61301f-0219-481a-b067-fad4547c4040',
            email: 'ntagungiraali@gmail.com',
            firstName: 'Ali',
            lastName: 'Rashid',
            phoneNumber: '0781111111',
            password: 'qeqerqrew',
            passwordResetToken: null,
            passwordResetExpires: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: UserRole.USER,
            isActive: true,
          },
          date: new Date(),
          checkIn: new Date(),
          checkOut: null,
          isComplete: false,
        },
      ]);

      return request(app.getHttpServer())
        .get('/attendance/daily')
        .set('Authorization', `Bearer ${token}`) 
        .query({ date: queryDate })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0].employee.id).toBe(
            'db61301f-0219-481a-b067-fad4547c4040',
          );
        });
    });

    it('should return 200 for daily attendance without date query', async () => {
      jest.spyOn(attendanceService, 'getDailyAttendance').mockResolvedValue([]);

      return request(app.getHttpServer())
        .get('/attendance/daily')
        .set('Authorization', `Bearer ${token}`) 
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(0);
        });
    });
  });
});
