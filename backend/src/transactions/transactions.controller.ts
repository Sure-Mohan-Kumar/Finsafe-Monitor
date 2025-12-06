
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async createTransaction(@Req() req: any, @Body() dto: CreateTransactionDto) {
    const userId = req.user.userId; // from JwtStrategy.validate
    const result = await this.transactionsService.createForUser(userId, dto);

    return {
      transaction: result.transaction,
      riskScore: result.fraud.riskScore,
      riskLevel: result.fraud.riskLevel,
      reasons: result.fraud.reasons,
    };
  }

  @Get()
  async getMyTransactions(@Req() req: any) {
    const userId = req.user.userId;
    const transactions =
      await this.transactionsService.findAllForUser(userId);

    return { items: transactions };
  }

  @Get('stats')
  async getMyTransactionStats(@Req() req: any) {
    const userId = req.user.userId;
    const stats = await this.transactionsService.getUserStats(userId);
    return stats;
  }
}
