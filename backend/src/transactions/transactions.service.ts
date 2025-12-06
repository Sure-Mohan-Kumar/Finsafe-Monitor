import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FraudService, FraudResult } from './fraud.service';
import { User } from '../users/user.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly fraudService: FraudService,
  ) {}

  async createForUser(
    userId: number,
    dto: CreateTransactionDto,
  ): Promise<{ transaction: Transaction; fraud: FraudResult }> {
    const timestamp =
      dto.timestamp instanceof Date
        ? dto.timestamp
        : dto.timestamp
        ? new Date(dto.timestamp)
        : new Date();

    const transaction = this.txRepo.create({
      amount: dto.amount,
      merchant: dto.merchant,
      timestamp,
      category: dto.category,
      location: dto.location,
      currency: dto.currency || 'INR',
      user: { id: userId } as User,
    });

    // Save first so it has a real ID and createdAt
    const saved = await this.txRepo.save(transaction);

    // Fetch recent transactions for fraud checks (last 24h)
    const since = new Date(timestamp.getTime() - 24 * 60 * 60 * 1000);
    const recentTransactions = await this.txRepo.find({
      where: {
        user: { id: userId },
        timestamp: MoreThan(since),
      },
    });

    const fraud = this.fraudService.evaluateSingle(saved, recentTransactions);

    return { transaction: saved, fraud };
  }

  async findAllForUser(userId: number): Promise<Transaction[]> {
    return this.txRepo.find({
      where: { user: { id: userId } },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Returns a simple risk summary for the user.
   */
  async getUserStats(userId: number) {
    const transactions = await this.findAllForUser(userId);

    const total = transactions.length;
    if (total === 0) {
      return {
        totalTransactions: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        highRiskPercentage: 0,
        mediumRiskPercentage: 0,
        lowRiskPercentage: 0,
      };
    }

    // Re-evaluate each transaction against recent history (naive but fine for demo)
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const tx of transactions) {
      const since = new Date(tx.timestamp.getTime() - 24 * 60 * 60 * 1000);
      const recent = transactions.filter(
        (t) =>
          t.timestamp >= since &&
          t.timestamp <= tx.timestamp &&
          t.user?.id === userId,
      );

      const result = this.fraudService.evaluateSingle(tx, recent);

      if (result.riskLevel === 'high') high++;
      else if (result.riskLevel === 'medium') medium++;
      else low++;
    }

    const pct = (count: number) => Number(((count / total) * 100).toFixed(1));

    return {
      totalTransactions: total,
      highRiskCount: high,
      mediumRiskCount: medium,
      lowRiskCount: low,
      highRiskPercentage: pct(high),
      mediumRiskPercentage: pct(medium),
      lowRiskPercentage: pct(low),
    };
  }
}
