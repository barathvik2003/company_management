import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { SessionUser } from '@cms/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SessionService } from './session.service';
import { BCRYPT_ROUNDS } from './auth.constants';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly session: SessionService,
  ) {}

  async login(
    email: string,
    password: string,
    ctx: RequestContext,
  ): Promise<{ user: SessionUser; tokens: TokenPair }> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, passwordHash: true, status: true, companyId: true, email: true },
    });

    // Always compare against something so response time does not reveal
    // whether the email exists.
    const hash = record?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const matches = await bcrypt.compare(password, hash);

    if (!record || !matches) {
      await this.audit.record({
        companyId: record?.companyId ?? null,
        actorEmail: email,
        action: AuditAction.LOGIN_FAILED,
        entity: 'User',
        entityId: record?.id ?? null,
        summary: `Failed sign-in attempt for ${email}`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedException('Email or password is incorrect');
    }

    if (record.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active. Contact your administrator.');
    }

    const user = await this.session.load(record.id);
    const tokens = await this.issueTokens(user, ctx);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.record({
      companyId: user.companyId,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      summary: `${user.email} signed in`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { user: await this.toSessionUser(user), tokens };
  }

  async refresh(rawToken: string, ctx: RequestContext): Promise<{ user: SessionUser; tokens: TokenPair }> {
    if (!rawToken) throw new UnauthorizedException('No refresh token supplied');

    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired, please sign in again');
    }

    // Rotation: a refresh token is single-use. If an old one is replayed we
    // have already revoked it above, so the attacker gains nothing.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.session.load(stored.userId);
    const tokens = await this.issueTokens(user, ctx);
    return { user: await this.toSessionUser(user), tokens };
  }

  async logout(userId: string | null, rawToken: string | undefined, ctx: RequestContext): Promise<void> {
    if (rawToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(rawToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true, email: true },
      });
      await this.audit.record({
        companyId: user?.companyId ?? null,
        actorId: userId,
        actorEmail: user?.email ?? null,
        action: AuditAction.LOGOUT,
        entity: 'User',
        entityId: userId,
        summary: `${user?.email ?? userId} signed out`,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ctx: RequestContext,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, passwordHash: true, companyId: true, email: true },
    });

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must differ from the current one');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Bumping tokenVersion invalidates every existing access token, and
    // revoking the refresh tokens signs out other devices.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, tokenVersion: { increment: 1 }, mustChangePassword: false },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      companyId: user.companyId,
      actorId: userId,
      actorEmail: user.email,
      action: AuditAction.PASSWORD_CHANGE,
      entity: 'User',
      entityId: userId,
      summary: `${user.email} changed their password`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  async currentUser(user: AuthenticatedUser): Promise<SessionUser> {
    return this.toSessionUser(user);
  }

  private async issueTokens(user: AuthenticatedUser, ctx: RequestContext): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, ver: user.tokenVersion },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
      },
    );

    // The refresh token is opaque random bytes, not a JWT: it only has to be
    // unguessable, and storing only its hash means a database leak is useless.
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshExpiresAt = addDuration(this.config.get<string>('JWT_REFRESH_TTL', '7d'));

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent?.slice(0, 250) ?? null,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  private async toSessionUser(user: AuthenticatedUser): Promise<SessionUser> {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { status: true, mustChangePassword: true },
    });
    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: record.status,
      mustChangePassword: record.mustChangePassword,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Parses "15m" / "7d" / "12h" into an absolute expiry. */
export function addDuration(duration: string, from: Date = new Date()): Date {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) throw new Error(`Unsupported duration: ${duration}`);
  const amount = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return new Date(from.getTime() + amount * ms);
}
