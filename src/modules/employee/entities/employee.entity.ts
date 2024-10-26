import { User } from 'src/modules/auth/entities/user.entity';
import { Column, Entity } from 'typeorm';

@Entity('users')
export class Employee extends User {
}
