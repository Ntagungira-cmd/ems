import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from '../entities/employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee.dto';
import { MailService } from 'src/modules/mail/mail.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private mailService: MailService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findOne({
      where: [{ email: createEmployeeDto.email }],
    });

    if (existingEmployee) {
      throw new ConflictException(
        'Employee with this email or identifier already exists',
      );
    }
    const autoPassword = Math.random().toString(36).slice(-8);
    const tempPassword = await bcrypt.hash(autoPassword, 10);

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      isActive: true,
      password: tempPassword,
    });

    await this.mailService.sendWelcomeEmail(
      employee.email,
      `${employee.firstName} ${employee.lastName}`,
      autoPassword,
    );
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

    const existingEmail = await this.employeeRepository.findOne({
      where: { email: updateEmployeeDto.email },
    });

    if (existingEmail && existingEmail.id !== id) {
      throw new ConflictException('Email already in use');
    }

    // Update the employee
    const updatedEmployee = await this.employeeRepository.save({
      ...employee,
      ...updateEmployeeDto,
    });

    return updatedEmployee;
  }

  async remove(id: string): Promise<void> {
    const result = await this.employeeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
  }
}
