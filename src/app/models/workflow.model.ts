import { User } from './user.model';

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CHANGES = 'REQUEST_CHANGES'
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverRole: string;
  approverId?: string;
  approver?: User;
  status: WorkflowStatus;
  comments?: string;
  approvedAt?: Date;
  required: boolean;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
  requesterId: string;
  requester?: User;
  steps: ApprovalStep[];
  currentStepNumber: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface WorkflowRequest {
  title: string;
  description: string;
  steps: Omit<ApprovalStep, 'id' | 'status' | 'approvedAt'>[];
  metadata?: Record<string, any>;
}

export interface ApprovalDecision {
  action: ApprovalAction;
  comments: string;
}
