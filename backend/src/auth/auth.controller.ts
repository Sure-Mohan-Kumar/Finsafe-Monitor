// src/auth/auth.controller.ts (only the callback part shown)
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // initiates Google OAuth2 flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any) {
    const profile = req.user;
    let user = await this.usersService.findByGoogleId(profile.googleId);
    if (!user) {
      user = await this.usersService.findByEmail(profile.email);
    }

    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
        avatar: profile.avatar,
        role: 'user',
      });
    } else if (!user.googleId) {
      user.googleId = profile.googleId;
      await this.usersService.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return { accessToken: token, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } };
  }
}
