import { BadRequestException, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { UserRole } from 'src/common/enums/role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'example@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        role: 'user',
        password: 'password123',
      };

      jest.spyOn(authService, 'register').mockImplementation(async () => ({
        id: 'asd-123-asd-123',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phoneNumber: registerDto.phoneNumber,
        role: UserRole.USER,
        password: registerDto.password,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(registerDto.email);
        });
    });

    it('should return 400 for invalid data', async () => {
      const invalidRegisterDto = {
        email: 'invalid-email',
        firstName: '',
        lastName: '',
        phoneNumber: '123',
        password: 'short',
      };

      jest.spyOn(authService, 'register').mockImplementation(async () => {
        throw new BadRequestException();
      });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidRegisterDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should log in an existing user', async () => {
      const loginDto = {
        email: 'example@gmail.com',
        password: 'password123',
      };

      jest.spyOn(authService, 'login').mockImplementation(async () => ({
        accessToken: 'fake-jwt-token',
      }));

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
        });
    });

    it('should return 401 for invalid credentials', async () => {
      const invalidLoginDto = {
        email: 'nonexistent@gmail.com',
        password: 'wrongpassword',
      };

      // Mock the login method to throw UnauthorizedException for invalid credentials
      jest.spyOn(authService, 'login').mockImplementation(async () => {
        throw new UnauthorizedException();
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLoginDto)
        .expect(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should initiate password reset', async () => {
      const forgotPasswordDto = { email: 'example@gmail.com' };

      jest
        .spyOn(authService, 'forgotPassword')
        .mockImplementation(async () => {});

      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe(
            'Reset instructions sent to email if account exists',
          );
        });
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset the user password', async () => {
      const resetPasswordDto = {
        password: 'newpassword123',
      };
      const token = 'asd-123-asd-123';

      jest
        .spyOn(authService, 'resetPassword')
        .mockImplementation(async () => {});

      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .query({ token })
        .send(resetPasswordDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Password successfully reset');
        });
    });

    it('should return Invalid Token for invalid token', async () => {
      const resetPasswordDto = {
        password: 'newpassword123',
      };
      const invalidToken = 'invalid-token';

      jest.spyOn(authService, 'resetPassword').mockImplementation(async () => {
        throw new BadRequestException('Invalid Token');
      });

      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .query({ token: invalidToken })
        .send(resetPasswordDto)
        .expect(400) 
        .expect((res) => {
          expect(res.body.message).toBe('Invalid Token');
        });
    });
  });
});
