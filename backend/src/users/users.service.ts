// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string) {
    return this.usersRepo.findOne({ where: { googleId } });
  }

  create(userPartial: Partial<User>) {
    const user = this.usersRepo.create(userPartial);
    return this.usersRepo.save(user);
  }

  save(user: User) {
    return this.usersRepo.save(user);
  }
}
