import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    const { userId } = req.user;

    const user = await this.usersService.findByEmail(req.user.email);
    if (!user) {
      return { message: 'User not found' };
    }

    const { id, email, name, avatar, role, createdAt } = user;
    return { id, email, name, avatar, role, createdAt };
  }
}
