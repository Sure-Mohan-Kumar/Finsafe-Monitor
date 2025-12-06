import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    eager: false,
  })
  user: User;

  @Column('float')
  amount: number;

  @Column()
  merchant: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true, default: 'INR' })
  currency?: string;

  @CreateDateColumn()
  createdAt: Date;
}
