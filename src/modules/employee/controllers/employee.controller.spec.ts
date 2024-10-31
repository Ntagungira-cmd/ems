import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from '../services/employee.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';
import { Employee } from '../entities/employee.entity';
import { HttpException } from '@nestjs/common';
import { UserRole } from 'src/common/enums/role.enum';
import { EmployeesController } from './employee.controller';

describe('EmployeesController', () => {
  let employeesController: EmployeesController;
  let employeesService: EmployeesService;

  const mockEmployee: Employee = {
    id: '9ae9aedf-82ee-40ae-9e24-f7ad58f8fc78',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '0785498839',
    createdAt: new Date(),
    updatedAt: new Date(),
    password: '',
    role: UserRole.USER,
    isActive: true,
  };

  const mockEmployeesService = {
    create: jest.fn().mockResolvedValue(mockEmployee),
    findAll: jest.fn().mockResolvedValue([mockEmployee]),
    findOne: jest.fn().mockResolvedValue(mockEmployee),
    update: jest.fn().mockResolvedValue(mockEmployee),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
      ],
    }).compile();

    employeesController = module.get<EmployeesController>(EmployeesController);
    employeesService = module.get<EmployeesService>(EmployeesService);
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '0791364384',
      };

      const result = await employeesController.create(createEmployeeDto);
      expect(result).toEqual(mockEmployee);
      expect(employeesService.create).toHaveBeenCalledWith(createEmployeeDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of employees', async () => {
      const result = await employeesController.findAll();
      expect(result).toEqual([mockEmployee]);
      expect(employeesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single employee by id', async () => {
      const result = await employeesController.findOne('1');
      expect(result).toEqual(mockEmployee);
      expect(employeesService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const updateEmployeeDto: UpdateEmployeeDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phoneNumber: '0791364384',
      };

      const result = await employeesController.update('1', updateEmployeeDto);
      expect(result).toEqual(mockEmployee);
      expect(employeesService.update).toHaveBeenCalledWith(
        '1',
        updateEmployeeDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete an employee', async () => {
      const result = await employeesController.remove('1');
      expect(result).toBeUndefined();
      expect(employeesService.remove).toHaveBeenCalledWith('1');
    });
  });
});
