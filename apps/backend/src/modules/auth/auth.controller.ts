import { Controller, Post, Body, Get, Req, Res, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { generateCsrfToken } from '../../common/middleware/csrf.middleware';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

const COOKIE_NAME = 'access_token';
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;

function setSessionCookie(res: Response, accessToken: string) {
  res.cookie(COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user, company } = await this.authService.login(body.email, body.password);
    setSessionCookie(res, accessToken);
    return { user, company };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user, company } = await this.authService.register(body);
    setSessionCookie(res, accessToken);
    return { user, company };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: Request) {
    const appUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    await this.authService.forgotPassword(body.email, appUrl);
    return { message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { message: 'Mot de passe mis à jour avec succès.' };
  }

  @Public()
  @Get('invite/:token')
  getInvite(@Param('token') token: string) {
    return this.authService.validateInvite(token);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Body() body: AcceptInviteDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, user, company } = await this.authService.acceptInvite(body);
    setSessionCookie(res, accessToken);
    return { user, company };
  }

  @Public()
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return { csrfToken: generateCsrfToken(req, res) };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME);
    return { success: true };
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() currentUser?: AuthenticatedUser) {
    if (!currentUser || !currentUser.userId) {
      return { user: null, company: null };
    }
    try {
      return await this.authService.getProfile(currentUser.userId);
    } catch {
      return { user: null, company: null };
    }
  }
}
