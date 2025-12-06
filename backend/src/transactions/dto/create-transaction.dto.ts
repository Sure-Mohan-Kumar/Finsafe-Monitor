export class CreateTransactionDto {
  amount: number;
  merchant: string;
  timestamp?: string | Date;
  category?: string;
  location?: string;
  currency?: string;
}
