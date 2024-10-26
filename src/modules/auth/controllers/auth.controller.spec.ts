import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should call AuthService.register with the correct DTO', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '0791364384'
      };

      await authController.register(registerDto);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should return an access token when login is successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockToken = { accessToken: 'accessToken' };
      jest.spyOn(authService, 'login').mockResolvedValue(mockToken);

      const result = await authController.login(loginDto);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockToken);
    });

    it('should have the status code OK (200)', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest
        .spyOn(authService, 'login')
        .mockResolvedValue({ accessToken: 'accessToken' });

      const result = await authController.login(loginDto);
      expect(result).toEqual({ accessToken: 'accessToken' });
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('forgotPassword', () => {
    it('should call AuthService.forgotPassword with the correct DTO', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      await authController.forgotPassword(forgotPasswordDto);
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
      );
    });

    it('should return a confirmation message', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      const result = await authController.forgotPassword(forgotPasswordDto);
      expect(result).toEqual({
        message: 'Reset instructions sent to email if account exists',
      });
    });
  });

  describe('resetPassword', () => {
    it('should call AuthService.resetPassword with the correct DTO', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'validToken',
        password: 'newpassword123',
      };

      await authController.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto,
      );
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });

    it('should return a success message after password reset', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'validToken',
        password: 'newpassword123',
      };

      const result = await authController.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto,
      );
      expect(result).toEqual({ message: 'Password successfully reset' });
    });
  });
});
