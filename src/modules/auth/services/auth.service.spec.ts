import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/modules/mail/mail.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock repository
const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

// Mock MailService
const mockMailService = {
  sendPasswordResetEmail: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user and return it', async () => {
    const mockUser = {
      id: '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    } as User;

    // Mocking create and save
    mockUserRepository.create.mockReturnValue(mockUser);
    mockUserRepository.save.mockResolvedValue(mockUser);

    const result = await authService.register({
      email: 'test@test.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(result).toEqual(mockUser);
    expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should generate a reset token and send email', async () => {
    const mockUser = {
      id: '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
      email: 'test@test.com',
      passwordResetToken: '',
      passwordResetExpires: null,
    } as User;

    // Mocking findOne and save
    mockUserRepository.findOne.mockResolvedValue(mockUser);
    mockUserRepository.save.mockResolvedValue(mockUser);

    await authService.forgotPassword({ email: 'test@test.com' });

    expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
    expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('should throw error if reset token is invalid or expired', async () => {
    const mockUser = {
      passwordResetToken: 'hashedToken',
      passwordResetExpires: new Date(Date.now() - 3600000),
    } as User;

    mockUserRepository.findOne.mockResolvedValue(mockUser);

    await expect(
      authService.resetPassword({
        token: 'invalidToken',
        password: 'newpassword',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reset the password and clear reset fields', async () => {
    const mockUser = {
      id: "9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78",
      email: 'test@test.com',
      passwordResetToken: await bcrypt.hash('validToken', 10),
      passwordResetExpires: new Date(Date.now() + 3600000),
    } as User;

    
    mockUserRepository.findOne.mockResolvedValue(mockUser);
    mockUserRepository.save.mockResolvedValue(mockUser);

  
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    await authService.resetPassword({
      token: 'validToken',
      password: 'newpassword',
    });


    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordResetToken: null,
        passwordResetExpires: null,
      }),
    );
  });
});
