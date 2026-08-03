import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface RecordAuditLogParams {
  userId?: string;
  event: string;
  provider: string;
  identifier?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: RecordAuditLogParams): Promise<void> {
    try {
      await this.prisma.authAuditLog.create({
        data: {
          userId: params.userId,
          event: params.event,
          provider: params.provider,
          identifier: params.identifier,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: params.metadata
            ? (JSON.parse(
                JSON.stringify(params.metadata),
              ) as Prisma.InputJsonValue)
            : undefined,
        },
      });
      this.logger.debug(
        `Audit event recorded: [${params.provider}] ${params.event}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record audit log for event ${params.event}:`,
        error,
      );
    }
  }
}
