import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employee.service';
import { Employee } from '../entities/employee.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';
import { UserRole } from 'src/Enums/role.enum';

describe('EmployeesService', () => {
  let employeesService: EmployeesService;
  let employeeRepository: Repository<Employee>;

  const mockEmployee: Employee = {
    id: '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
    password: '',
    role: UserRole.USER,
    isActive: false,
  };

  const mockEmployeeRepository = {
    create: jest.fn().mockImplementation((dto: CreateEmployeeDto) => ({
      ...dto,
      id: '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    save: jest.fn().mockResolvedValue(mockEmployee),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([mockEmployee]),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
      ],
    }).compile();

    employeesService = module.get<EmployeesService>(EmployeesService);
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '0791364384',
      };

      const result = await employeesService.create(createEmployeeDto);
      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeRepository.create).toHaveBeenCalledWith(
        createEmployeeDto,
      );
      expect(mockEmployeeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(createEmployeeDto),
      );
    });

    it('should throw a ConflictException if the employee already exists', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);

      const createEmployeeDto: CreateEmployeeDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '0791364384',
      };

      await expect(employeesService.create(createEmployeeDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of employees', async () => {
      const result = await employeesService.findAll();
      expect(result).toEqual([mockEmployee]);
      expect(mockEmployeeRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single employee by id', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);

      const result = await employeesService.findOne(
        '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
      );
      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78' },
      });
    });

    it('should throw a NotFoundException if the employee does not exist', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(employeesService.findOne('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const updateEmployeeDto: UpdateEmployeeDto = {
        email: 'john.doe_updated@example.com',
      };

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);

      const result = await employeesService.update(
        '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
        updateEmployeeDto,
      );
      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateEmployeeDto),
      );
    });

    it('should throw a ConflictException if the email is already used by another employee', async () => {
      const updateEmployeeDto: UpdateEmployeeDto = {
        email: 'john.doe@example.com',
      };

      mockEmployeeRepository.findOne.mockResolvedValueOnce(mockEmployee);
      mockEmployeeRepository.findOne.mockResolvedValueOnce({
        ...mockEmployee,
        id: '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc76',
      });

      await expect(
        employeesService.update(
          '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
          updateEmployeeDto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw a NotFoundException if the employee does not exist', async () => {
      mockEmployeeRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        employeesService.update(
          '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
          {} as UpdateEmployeeDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an employee', async () => {
      mockEmployeeRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(
        employeesService.remove('9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78'),
      ).resolves.not.toThrow();
      expect(mockEmployeeRepository.delete).toHaveBeenCalledWith(
        '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
      );
    });

    it('should throw a NotFoundException if the employee does not exist', async () => {
      mockEmployeeRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        employeesService.remove('9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
