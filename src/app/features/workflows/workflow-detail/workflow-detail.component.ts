import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';
import { AuthService } from '../../../core/services/auth.service';
import { Workflow, WorkflowStatus, ApprovalAction, ApprovalDecision, ApprovalStep } from '../../../models/workflow.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workflow-detail.component.html',
  styleUrls: ['./workflow-detail.component.css']
})
export class WorkflowDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workflowService = inject(WorkflowService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  workflow = signal<Workflow | null>(null);
  currentUser = signal<User | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isSubmitting = signal(false);
  isCancelling = signal(false);

  approvalForm: FormGroup;

  readonly WorkflowStatus = WorkflowStatus;
  readonly ApprovalAction = ApprovalAction;

  canApprove = computed(() => {
    const wf = this.workflow();
    const user = this.currentUser();
    if (!wf || !user) return null;

    const currentStep = wf.steps.find(s => s.stepNumber === wf.currentStepNumber);
    if (!currentStep || currentStep.status !== WorkflowStatus.PENDING) return null;

    if (currentStep.approverRole === user.role) {
      return currentStep;
    }
    return null;
  });

  canCancel = computed(() => {
    const wf = this.workflow();
    const user = this.currentUser();
    if (!wf || !user) return false;

    const isRequester = wf.requesterId === user.id;
    const isAdmin = user.role === 'ADMIN';
    const isNotCompleted = wf.status !== WorkflowStatus.APPROVED && 
                          wf.status !== WorkflowStatus.REJECTED &&
                          wf.status !== WorkflowStatus.CANCELLED;

    return (isRequester || isAdmin) && isNotCompleted;
  });

  constructor() {
    this.approvalForm = this.fb.group({
      action: [ApprovalAction.APPROVE, Validators.required],
      comments: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadWorkflow();
  }

  private loadWorkflow(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.workflowService.getWorkflow(id).subscribe({
      next: (workflow) => {
        if (workflow) {
          this.workflow.set(workflow);
        } else {
          this.error.set('Workflow not found');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load workflow');
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(status: WorkflowStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  onSubmitApproval(): void {
    if (this.approvalForm.invalid || this.isSubmitting()) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    const wf = this.workflow();
    const stepToApprove = this.canApprove();
    
    if (!wf || !stepToApprove) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.approvalForm.value;
    const decision: ApprovalDecision = {
      action: formValue.action,
      comments: formValue.comments
    };

    this.workflowService.approveStep(wf.id, stepToApprove.id, decision).subscribe({
      next: (updatedWorkflow) => {
        this.workflow.set(updatedWorkflow);
        this.approvalForm.reset({
          action: ApprovalAction.APPROVE,
          comments: ''
        });
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to submit approval');
        this.isSubmitting.set(false);
      }
    });
  }

  onCancelWorkflow(): void {
    if (!confirm('Are you sure you want to cancel this workflow?')) {
      return;
    }

    const wf = this.workflow();
    if (!wf) return;

    this.isCancelling.set(true);
    this.error.set(null);

    this.workflowService.cancelWorkflow(wf.id).subscribe({
      next: (updatedWorkflow) => {
        this.workflow.set(updatedWorkflow);
        this.isCancelling.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to cancel workflow');
        this.isCancelling.set(false);
      }
    });
  }

  retry(): void {
    this.loadWorkflow();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  get comments() {
    return this.approvalForm.get('comments');
  }

  trackByStepId(index: number, step: ApprovalStep): string {
    return step.id;
  }
}
