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

const SENSITIVE_KEY_PATTERN = /^(password|passwordHash|otp|code|token|secret|authorization|keySecret|apiKey|apiToken|signature)$/i;

function redactSensitive(value: any, depth = 0): any {
  if (depth > 5 || value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEY_PATTERN.test(k) ? '[REDACTED]' : redactSensitive(v, depth + 1);
    }
    return out;
  }
  return value;
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
        details: entry.details ? redactSensitive(entry.details) : undefined,
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

