import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; pass: string }) {
    return this.authService.login(body.email || 'admin@financpro.ci', body.pass || 'admin');
  }

  @Get('me')
  getProfile(@Headers('authorization') authHeader: string) {
    return this.authService.getProfile('usr-1');
  }
}
