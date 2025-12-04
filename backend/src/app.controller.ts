import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller()
export class AppController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get('db-health')
  async healthCheck() {
    // run a lightweight check
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', timestamp: new Date() };
  }
}