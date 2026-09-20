import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { SessionService } from '../session.service';
import { ACCESS_COOKIE } from '../auth.constants';

export interface JwtPayload {
  sub: string;
  ver: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly session: SessionService,
  ) {
    super({
      // Cookie first (browser), bearer second (scripts and tests).
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req.cookies?.[ACCESS_COOKIE] as string | undefined) ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.session.load(payload.sub);
    if (user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException('Session expired, please sign in again');
    }
    return user;
  }
}
