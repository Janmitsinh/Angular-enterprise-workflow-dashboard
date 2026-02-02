import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { 
  Workflow, 
  WorkflowRequest, 
  WorkflowStatus, 
  ApprovalDecision,
  ApprovalAction,
  ApprovalStep
} from '../../models/workflow.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private authService = inject(AuthService);
  
  private workflowsSubject = new BehaviorSubject<Workflow[]>([]);
  public workflows$ = this.workflowsSubject.asObservable();
  
  private nextId = 1;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockWorkflows: Workflow[] = [
      {
        id: '1',
        title: 'Budget Approval Request',
        description: 'Request for Q1 2024 marketing budget approval',
        status: WorkflowStatus.PENDING,
        requesterId: '3',
        steps: [
          {
            id: 's1',
            stepNumber: 1,
            approverRole: 'MANAGER',
            status: WorkflowStatus.PENDING,
            required: true
          },
          {
            id: 's2',
            stepNumber: 2,
            approverRole: 'ADMIN',
            status: WorkflowStatus.DRAFT,
            required: true
          }
        ],
        currentStepNumber: 1,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        id: '2',
        title: 'Employee Leave Request',
        description: 'Annual leave request for 2 weeks',
        status: WorkflowStatus.IN_PROGRESS,
        requesterId: '3',
        steps: [
          {
            id: 's3',
            stepNumber: 1,
            approverRole: 'MANAGER',
            approverId: '2',
            status: WorkflowStatus.APPROVED,
            comments: 'Approved',
            approvedAt: new Date(Date.now() - 3600000),
            required: true
          },
          {
            id: 's4',
            stepNumber: 2,
            approverRole: 'ADMIN',
            status: WorkflowStatus.PENDING,
            required: true
          }
        ],
        currentStepNumber: 2,
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 3600000)
      }
    ];
    
    this.workflowsSubject.next(mockWorkflows);
    this.nextId = 3;
  }

  getWorkflows(): Observable<Workflow[]> {
    return this.workflows$;
  }

  getWorkflow(id: string): Observable<Workflow | undefined> {
    return this.workflows$.pipe(
      delay(200),
      map(workflows => workflows.find(w => w.id === id))
    );
  }

  createWorkflow(request: WorkflowRequest): Observable<Workflow> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return of(request).pipe(
      delay(500),
      map(() => {
        const newWorkflow: Workflow = {
          id: String(this.nextId++),
          title: request.title,
          description: request.description,
          status: WorkflowStatus.PENDING,
          requesterId: currentUser.id,
          requester: currentUser,
          steps: request.steps.map((step, index) => ({
            ...step,
            id: `s${this.nextId + index}`,
            status: index === 0 ? WorkflowStatus.PENDING : WorkflowStatus.DRAFT
          })),
          currentStepNumber: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: request.metadata
        };

        const workflows = this.workflowsSubject.value;
        this.workflowsSubject.next([...workflows, newWorkflow]);

        return newWorkflow;
      })
    );
  }

  approveStep(workflowId: string, stepId: string, decision: ApprovalDecision): Observable<Workflow> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.workflows$.pipe(
      delay(500),
      map(() => {
        const workflows = [...this.workflowsSubject.value];
        const workflowIndex = workflows.findIndex(w => w.id === workflowId);
        
        if (workflowIndex === -1) {
          throw new Error('Workflow not found');
        }

        const workflow = { ...workflows[workflowIndex] };
        const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
        
        if (stepIndex === -1) {
          throw new Error('Step not found');
        }

        const step = { ...workflow.steps[stepIndex] };
        
        // Update step
        step.approverId = currentUser.id;
        step.approver = currentUser;
        step.status = decision.action === ApprovalAction.APPROVE 
          ? WorkflowStatus.APPROVED 
          : WorkflowStatus.REJECTED;
        step.comments = decision.comments;
        step.approvedAt = new Date();

        workflow.steps = [
          ...workflow.steps.slice(0, stepIndex),
          step,
          ...workflow.steps.slice(stepIndex + 1)
        ];

        // Update workflow status
        if (decision.action === ApprovalAction.REJECT) {
          workflow.status = WorkflowStatus.REJECTED;
          workflow.completedAt = new Date();
        } else if (stepIndex === workflow.steps.length - 1) {
          // Last step approved
          workflow.status = WorkflowStatus.APPROVED;
          workflow.completedAt = new Date();
        } else {
          // Move to next step
          workflow.status = WorkflowStatus.IN_PROGRESS;
          workflow.currentStepNumber = step.stepNumber + 1;
          workflow.steps[stepIndex + 1].status = WorkflowStatus.PENDING;
        }

        workflow.updatedAt = new Date();
        workflows[workflowIndex] = workflow;
        this.workflowsSubject.next(workflows);

        return workflow;
      })
    );
  }

  cancelWorkflow(workflowId: string): Observable<Workflow> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.workflows$.pipe(
      delay(300),
      map(() => {
        const workflows = [...this.workflowsSubject.value];
        const workflowIndex = workflows.findIndex(w => w.id === workflowId);
        
        if (workflowIndex === -1) {
          throw new Error('Workflow not found');
        }

        const workflow = { ...workflows[workflowIndex] };
        workflow.status = WorkflowStatus.CANCELLED;
        workflow.updatedAt = new Date();
        workflow.completedAt = new Date();

        workflows[workflowIndex] = workflow;
        this.workflowsSubject.next(workflows);

        return workflow;
      })
    );
  }

  getMyWorkflows(): Observable<Workflow[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of([]);
    }

    return this.workflows$.pipe(
      map(workflows => workflows.filter(w => w.requesterId === currentUser.id))
    );
  }

  getPendingApprovals(): Observable<Workflow[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return of([]);
    }

    return this.workflows$.pipe(
      map(workflows => workflows.filter(w => {
        if (w.status !== WorkflowStatus.PENDING && w.status !== WorkflowStatus.IN_PROGRESS) {
          return false;
        }
        
        const currentStep = w.steps.find(s => s.stepNumber === w.currentStepNumber);
        return currentStep?.approverRole === currentUser.role && currentStep?.status === WorkflowStatus.PENDING;
      }))
    );
  }
}
