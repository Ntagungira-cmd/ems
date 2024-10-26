import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';


@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findOne({
      where: [
        { email: createEmployeeDto.email },
      ],
    });

    if (existingEmployee) {
      throw new ConflictException(
        'Employee with this email or identifier already exists',
      );
    }

    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(id);

    if (updateEmployeeDto.email) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: [
          { email: updateEmployeeDto.email },
        ],
      });

      if (existingEmployee && existingEmployee.id !== id) {
        throw new ConflictException(
          'Email or employee identifier already in use',
        );
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const result = await this.employeeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
  }
}
