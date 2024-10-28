import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employee.service';
import { Employee } from '../entities/employee.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from 'src/modules/mail/mail.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: Repository<Employee>;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getRepositoryToken(Employee),
          useClass: Repository,
        },
        {
          provide: MailService,
          useValue: { sendWelcomeEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    repository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(mailService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new employee and send a welcome email', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '079136384',
      };
      const hashedPassword = 'hashedPassword';

      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(repository, 'create').mockImplementation((dto) => dto as any);
      jest.spyOn(repository, 'save').mockResolvedValueOnce({
        id: '8f724708-137b-46e2-bb42-d11c262ab408',
        ...createEmployeeDto,
        password: hashedPassword,
        isActive: true,
      } as Employee);

      const result = await service.create(createEmployeeDto);

      expect(result).toHaveProperty('email', createEmployeeDto.email);
      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        createEmployeeDto.email,
        `${createEmployeeDto.firstName} ${createEmployeeDto.lastName}`,
        expect.any(String),
      );
    });

    it('should throw a ConflictException if email already exists', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '0791364384',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce({} as Employee);

      await expect(service.create(createEmployeeDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of employees', async () => {
      const employees: Employee[] = [
        {
          id: '8f724708-137b-46e2-bb42-d11c262ab408',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          isActive: true,
        } as Employee,
      ];

      jest.spyOn(repository, 'find').mockResolvedValueOnce(employees);

      expect(await service.findAll()).toEqual(employees);
    });
  });

  describe('findOne', () => {
    it('should return an employee if found', async () => {
      const employee = {
        id: '8f724708-137b-46e2-bb42-d11c262ab408',
        email: 'test@example.com',
      } as Employee;

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(employee);

      expect(
        await service.findOne('8f724708-137b-46e2-bb42-d11c262ab408'),
      ).toEqual(employee);
    });

    it('should throw NotFoundException if employee not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.findOne('8f724708-137b-46e2-bb42-d11c262ab408'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const id = '8f724708-137b-46e2-bb42-d11c262ab408';
      const updateEmployeeDto: UpdateEmployeeDto = { email: 'new@example.com' };
      const employee = { id, email: 'old@example.com' } as Employee;
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(employee);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      jest.spyOn(repository, 'save').mockResolvedValueOnce({
        ...employee,
        ...updateEmployeeDto,
      });

      const result = await service.update(id, updateEmployeeDto);

      expect(result).toHaveProperty('email', updateEmployeeDto.email);
      expect(repository.save).toHaveBeenCalledWith({
        ...employee,
        ...updateEmployeeDto,
      });
    });

    it('should throw a ConflictException if email is already in use', async () => {
      const id = '8f724708-137b-46e2-bb42-d11c262ab408';
      const updateEmployeeDto: UpdateEmployeeDto = {
        email: 'existing@example.com',
      };
      const employee = { id, email: 'old@example.com' } as Employee;
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(employee);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce({
        id: '8f724708-137b-46e2-bb42-d11c262ab402',
        email: updateEmployeeDto.email,
      } as Employee);

      await expect(service.update(id, updateEmployeeDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an employee', async () => {
      const id = '8f724708-137b-46e2-bb42-d11c262ab408';
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValueOnce({ affected: 1, raw: {} });

      await expect(service.remove(id)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if employee not found', async () => {
      const id = '8f724708-137b-46e2-bb42-d11c262ab408';
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValueOnce({ affected: 0, raw: {} });

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });
});
