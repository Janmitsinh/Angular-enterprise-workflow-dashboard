import { User } from './user.model';
import { ApprovalAction } from './workflow.model';

export enum AuditActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE_WORKFLOW = 'CREATE_WORKFLOW',
  UPDATE_WORKFLOW = 'UPDATE_WORKFLOW',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL_WORKFLOW = 'CANCEL_WORKFLOW',
  VIEW_WORKFLOW = 'VIEW_WORKFLOW'
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: AuditActionType;
  entityType: string;
  entityId?: string;
  details?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditActionType;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
}
