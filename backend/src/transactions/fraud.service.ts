import { Injectable } from '@nestjs/common';
import { Transaction } from './transaction.entity';

export interface FraudResult {
  riskScore: number; // 0.0 - 1.0
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

@Injectable()
export class FraudService {
  evaluateSingle(
    transaction: Transaction,
    recentTransactions: Transaction[],
  ): FraudResult {
    let score = 0;
    const reasons: string[] = [];

    // ---- Rule 1: High amount ----
    if (transaction.amount >= 100000) {
      // very high
      score += 0.7;
      reasons.push('Very high transaction amount');
    } else if (transaction.amount >= 50000) {
      score += 0.5;
      reasons.push('High transaction amount');
    } else if (transaction.amount >= 10000) {
      score += 0.3;
      reasons.push('Above-average transaction amount');
    }

    // ---- Rule 2: Many transactions in last 1 hour ----
    const oneHourAgo = new Date(transaction.timestamp.getTime() - 60 * 60 * 1000);
    const txLastHour = recentTransactions.filter(
      (t) => t.timestamp >= oneHourAgo && t.timestamp <= transaction.timestamp,
    );

    if (txLastHour.length >= 10) {
      score += 0.5;
      reasons.push('Unusual number of transactions in the last hour');
    } else if (txLastHour.length >= 5) {
      score += 0.3;
      reasons.push('High number of transactions in the last hour');
    }

    // ---- Rule 3: New merchant for this user ----
    // Exclude the current transaction when checking "seen before"
    const previousTxForMerchant = recentTransactions.filter(
      (t) => t.merchant === transaction.merchant && t.id !== transaction.id,
    );
    const hasSeenMerchantBefore = previousTxForMerchant.length > 0;

    if (!hasSeenMerchantBefore) {
      score += 0.2;
      reasons.push('New merchant for this user');
    }

    // Clamp score between 0 and 1
    if (score > 1) {
      score = 1;
    }

    // ---- Map score to risk level ----
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (score >= 0.7) riskLevel = 'high';
    else if (score >= 0.3) riskLevel = 'medium';

    return { riskScore: score, reasons, riskLevel };
  }
}
