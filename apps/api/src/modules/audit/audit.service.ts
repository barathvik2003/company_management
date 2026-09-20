import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Keys that must never reach the audit table. */
const REDACTED = [
  'password', 'passwordhash', 'newpassword', 'currentpassword', 'confirmpassword',
  'token', 'accesstoken', 'refreshtoken', 'secret', 'apikey', 'authorization', 'cookie',
];

export interface AuditInput {
  companyId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Audit writes must never break the business operation that triggered them,
   * so failures are logged and swallowed rather than thrown.
   */
  async record(input: AuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          companyId: input.companyId ?? null,
          actorId: input.actorId ?? null,
          actorEmail: input.actorEmail ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          summary: input.summary,
          metadata: input.metadata ? (redact(input.metadata) as Prisma.InputJsonValue) : undefined,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent?.slice(0, 250) ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for ${input.entity}`, error as Error);
    }
  }
}

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = REDACTED.includes(key.toLowerCase()) ? '[redacted]' : redact(val);
    }
    return out;
  }
  return value;
}
