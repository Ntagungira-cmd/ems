import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/modules/mail/mail.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from 'src/common/Enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: Repository<User>;
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
          useValue: {
            sign: jest.fn().mockReturnValue('testToken'),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '123456789',
        role: UserRole.USER,
      } as User;

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(usersRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '123456789',
        role: UserRole.USER,
      });

      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if user already exists', async () => {
      const existingUser = { email: 'test@example.com' } as User;
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(existingUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '123456789',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return accessToken on valid login', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        id: '1',
        role: 'user',
      } as User;

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual({ accessToken: 'testToken' });
    });

    it('should throw UnauthorizedException on invalid login', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should send a password reset email', async () => {
      const mockUser = {
        email: 'test@example.com',
        firstName: 'John',
      } as User;

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(mockUser);

      await service.forgotPassword({ email: 'test@example.com' });

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      );
    });

    it('should throw BadRequestException if user is not found', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'notfound@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset the user password', async () => {
      const mockUser = {
        email: 'test@example.com',
        passwordResetToken: await bcrypt.hash('token', 10),
        passwordResetExpires: new Date(Date.now() + 3600000),
      } as User;

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(usersRepository, 'save').mockResolvedValue(mockUser);

      await service.resetPassword({ token: 'token', password: 'newPassword' });

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.any(String),
          passwordResetToken: null,
          passwordResetExpires: null,
        }),
      );
    });

    it('should throw BadRequestException if token is invalid or expired', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'wrongToken', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
