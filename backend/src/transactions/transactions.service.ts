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

  async findAll(userId?: number): Promise<Transaction[]> {
    if (userId) {
      return this.findAllForUser(userId);
    }

    return this.txRepo.find({
      relations: ['user'],
      order: { timestamp: 'DESC' },
    });
  }

  // ---------- Per-user stats (already had, kept as-is) ----------

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

    const { total: t, high, medium, low } =
      this.computeStatsForUserTransactions(transactions, userId);

    const pct = (count: number) =>
      Number(((count / t) * 100).toFixed(1));

    return {
      totalTransactions: t,
      highRiskCount: high,
      mediumRiskCount: medium,
      lowRiskCount: low,
      highRiskPercentage: pct(high),
      mediumRiskPercentage: pct(medium),
      lowRiskPercentage: pct(low),
    };
  }

  // ---------- Global stats across all users (NEW) ----------

  async getGlobalStats() {
    // Load all transactions with their user
    const transactions = await this.txRepo.find({
      relations: ['user'],
      order: { timestamp: 'ASC' },
    });

    const totalTransactions = transactions.length;
    if (totalTransactions === 0) {
      return {
        totalUsers: 0,
        totalTransactions: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        highRiskPercentage: 0,
        mediumRiskPercentage: 0,
        lowRiskPercentage: 0,
        users: [],
      };
    }

    // Group by user
    const byUser = new Map<number, Transaction[]>();

    for (const tx of transactions) {
      const userId = tx.user?.id;
      if (!userId) continue;

      if (!byUser.has(userId)) {
        byUser.set(userId, []);
      }
      byUser.get(userId)!.push(tx);
    }

    let globalHigh = 0;
    let globalMedium = 0;
    let globalLow = 0;

    const users: Array<{
      userId: number;
      email: string | null;
      totalTransactions: number;
      highRiskCount: number;
      mediumRiskCount: number;
      lowRiskCount: number;
      highRiskPercentage: number;
      mediumRiskPercentage: number;
      lowRiskPercentage: number;
      overallRiskLevel: 'low' | 'medium' | 'high';
    }> = [];

    for (const [userId, userTxs] of byUser.entries()) {
      const { total, high, medium, low } =
        this.computeStatsForUserTransactions(userTxs, userId);

      globalHigh += high;
      globalMedium += medium;
      globalLow += low;

      const pct = (count: number) =>
        Number(((count / total) * 100).toFixed(1));

      const highPct = pct(high);
      const mediumPct = pct(medium);
      const lowPct = pct(low);

      // Simple overall risk for user based on high-risk share
      let overallRiskLevel: 'low' | 'medium' | 'high' = 'low';
      if (highPct >= 50 || high >= 3) overallRiskLevel = 'high';
      else if (highPct >= 20 || mediumPct >= 30) overallRiskLevel = 'medium';

      const email = userTxs[0]?.user?.email ?? null;

      users.push({
        userId,
        email,
        totalTransactions: total,
        highRiskCount: high,
        mediumRiskCount: medium,
        lowRiskCount: low,
        highRiskPercentage: highPct,
        mediumRiskPercentage: mediumPct,
        lowRiskPercentage: lowPct,
        overallRiskLevel,
      });
    }

    const pctGlobal = (count: number) =>
      Number(((count / totalTransactions) * 100).toFixed(1));

    return {
      totalUsers: users.length,
      totalTransactions,
      highRiskCount: globalHigh,
      mediumRiskCount: globalMedium,
      lowRiskCount: globalLow,
      highRiskPercentage: pctGlobal(globalHigh),
      mediumRiskPercentage: pctGlobal(globalMedium),
      lowRiskPercentage: pctGlobal(globalLow),
      users,
    };
  }

  // ---------- Helper: reuse fraud logic per user ----------

  private computeStatsForUserTransactions(
    transactions: Transaction[],
    userId: number,
  ): { total: number; high: number; medium: number; low: number } {
    const total = transactions.length;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const tx of transactions) {
      const since = new Date(
        tx.timestamp.getTime() - 24 * 60 * 60 * 1000,
      );
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

    return { total, high, medium, low };
  }
}
