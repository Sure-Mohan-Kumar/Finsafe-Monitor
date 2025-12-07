import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { FraudService } from './fraud.service';
import { AdminTransactionsController } from './admin-transactions.controller';
import { RolesGuard } from '../auth/roles.gurad';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [TransactionsService, FraudService, RolesGuard],
  controllers: [TransactionsController, AdminTransactionsController],
})
export class TransactionsModule {}
