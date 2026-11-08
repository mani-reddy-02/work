import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  actorId: string;
  actorRole?: string;
  action: string;
  targetEntity: string;
  targetId: string;
  timestamp: string;
  clientIp?: string;
  details?: Record<string, any>;
}

export class AuditLogger {
  private static logDir = path.join(process.cwd(), 'logs');
  private static logFile = path.join(process.cwd(), 'logs/audit.log');

  public static async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }

      const fullEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
      };

      const line = JSON.stringify(fullEntry) + '\n';
      fs.appendFileSync(this.logFile, line, 'utf8');
      console.log(
        `[AUDIT_LOG] [${fullEntry.timestamp}] Actor: ${fullEntry.actorId} (${fullEntry.actorRole || 'UNKNOWN'}) Action: ${fullEntry.action} Entity: ${fullEntry.targetEntity}:${fullEntry.targetId} IP: ${fullEntry.clientIp || 'UNKNOWN'}`
      );
    } catch (err) {
      console.error('[AUDIT_LOG_ERROR] Failed to write audit log entry:', err);
    }
  }
}

