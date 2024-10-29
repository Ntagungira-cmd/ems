import { Employee } from 'src/modules/employee/entities/employee.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, { eager: true })
  employee: Employee;

  @CreateDateColumn()
  date: Date;

  @Column({ type: 'timestamp' })
  checkIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOut: Date;

  @Column({ default: false })
  isComplete: boolean;
}
