import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.gurad';
import { Roles } from '../auth/roles.decorator';
import { TransactionsService } from './transactions.service';

@Controller('admin/transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getAll(@Query('userId') userId?: string) {
    const uid = userId ? Number(userId) : undefined;
    const transactions = await this.transactionsService.findAll(uid);

    return { items: transactions };
  }

  @Get('stats')
  async getGlobalStats() {
    const stats = await this.transactionsService.getGlobalStats();
    return stats;
  }
}
