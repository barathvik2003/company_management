import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { SessionUser } from '@cms/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuthService, TokenPair } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Brute-force protection: 5 attempts per minute per IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionUser> {
    const { user, tokens } = await this.auth.login(dto.email, dto.password, context(req));
    this.setCookies(res, tokens);
    return user;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionUser> {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const { user, tokens } = await this.auth.refresh(raw ?? '', context(req));
    this.setCookies(res, tokens);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ loggedOut: true }> {
    await this.auth.logout(user.id, req.cookies?.[REFRESH_COOKIE] as string | undefined, context(req));
    this.clearCookies(res);
    return { loggedOut: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<SessionUser> {
    return this.auth.currentUser(user);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ changed: true }> {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword, context(req));
    this.clearCookies(res);
    return { changed: true };
  }

  private cookieOptions(expires: Date): CookieOptions {
    const domain = this.config.get<string>('COOKIE_DOMAIN', '').trim();
    const secure = this.config.get<string>('COOKIE_SECURE', 'false') === 'true';

    return {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      ...(domain ? { domain } : {}),
      path: '/',
      expires,
    };
  }

  private setCookies(res: Response, tokens: TokenPair): void {
    const accessExpiry = new Date(Date.now() + 15 * 60 * 1000);
    res.cookie(ACCESS_COOKIE, tokens.accessToken, this.cookieOptions(accessExpiry));
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, this.cookieOptions(tokens.refreshExpiresAt));
  }

  private clearCookies(res: Response): void {
    const expired = new Date(0);
    res.cookie(ACCESS_COOKIE, '', this.cookieOptions(expired));
    res.cookie(REFRESH_COOKIE, '', this.cookieOptions(expired));
  }
}

function context(req: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
