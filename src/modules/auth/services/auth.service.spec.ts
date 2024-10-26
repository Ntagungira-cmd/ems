import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/modules/mail/mail.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { UserRole } from 'src/Enums/role.enum';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let repository: Repository<User>;
  let jwtService: JwtService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'test-jwt-token') },
        },
        {
          provide: MailService,
          useValue: { sendPasswordResetEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(mailService).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        role: UserRole.USER,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...registerDto,
        id: '8f724708-137b-46e2-bb42-d11c262ab408',
      } as User);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('email', registerDto.email);
      expect(result).toHaveProperty('password', 'hashedPassword');
    });

    it('should throw BadRequestException if user already exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue({} as User);

      await expect(
        service.register({ email: 'test@example.com' } as RegisterDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return an access token for valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const user = {
        id: '8f724708-137b-46e2-bb42-d11c262ab408',
        email: 'test@example.com',
        password: 'hashedPassword',
      } as User;

      jest.spyOn(repository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'test-jwt-token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should generate a reset token and send email', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };
      const user = {
        id: '8f724708-137b-46e2-bb42-d11c262ab408',
        email: 'test@example.com',
        firstName: 'John',
      } as User;

      jest.spyOn(repository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedToken');
      jest.spyOn(repository, 'save').mockResolvedValue(user);

      await service.forgotPassword(forgotPasswordDto);

      expect(user.passwordResetToken).toBe('hashedToken');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        user.email,
        '8f724708-137b-46e2-bb42-d11c262ab408',
        user.firstName,
      );
    });

    it('should throw BadRequestException if user is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'notfound@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset the password if token is valid', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'validToken',
        password: 'newPassword123',
      };
      const user = {
        id: '8f724708-137b-46e2-bb42-d11c262ab408',
        passwordResetToken: 'hashedToken',
        passwordResetExpires: new Date(Date.now() + 3600000),
      } as User;

      jest.spyOn(repository, 'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword');
      jest.spyOn(repository, 'save').mockResolvedValue(user);

      await service.resetPassword(resetPasswordDto);

      expect(user.password).toBe('newHashedPassword');
      expect(user.passwordResetToken).toBeNull();
      expect(user.passwordResetExpires).toBeNull();
    });

    it('should throw BadRequestException for invalid or expired token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'invalidToken',
        password: 'newPassword123',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
