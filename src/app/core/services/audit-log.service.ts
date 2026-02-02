import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AuditLog, AuditActionType, AuditLogFilter } from '../../models/audit-log.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private authService = inject(AuthService);
  private logsSubject = new BehaviorSubject<AuditLog[]>([]);
  public logs$ = this.logsSubject.asObservable();
  
  private nextId = 1;

  log(
    action: AuditActionType, 
    entityType: string, 
    entityId?: string, 
    details?: string,
    metadata?: Record<string, any>
  ): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const auditLog: AuditLog = {
      id: String(this.nextId++),
      userId: currentUser.id,
      user: currentUser,
      action,
      entityType,
      entityId,
      details,
      metadata,
      timestamp: new Date(),
      ipAddress: '127.0.0.1' // Mock IP
    };

    const logs = this.logsSubject.value;
    this.logsSubject.next([auditLog, ...logs]);
  }

  getLogs(filter?: AuditLogFilter): Observable<AuditLog[]> {
    return this.logs$.pipe(
      delay(200),
      map(logs => {
        if (!filter) {
          return logs;
        }

        return logs.filter(log => {
          if (filter.userId && log.userId !== filter.userId) {
            return false;
          }
          if (filter.action && log.action !== filter.action) {
            return false;
          }
          if (filter.entityType && log.entityType !== filter.entityType) {
            return false;
          }
          if (filter.entityId && log.entityId !== filter.entityId) {
            return false;
          }
          if (filter.startDate && log.timestamp < filter.startDate) {
            return false;
          }
          if (filter.endDate && log.timestamp > filter.endDate) {
            return false;
          }
          return true;
        });
      })
    );
  }

  getRecentLogs(limit: number = 50): Observable<AuditLog[]> {
    return this.logs$.pipe(
      delay(200),
      map(logs => logs.slice(0, limit))
    );
  }

  getLogsByEntity(entityType: string, entityId: string): Observable<AuditLog[]> {
    return this.getLogs({ entityType, entityId });
  }

  getLogsByUser(userId: string): Observable<AuditLog[]> {
    return this.getLogs({ userId });
  }
}
