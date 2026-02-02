import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WorkflowService } from '../../core/services/workflow.service';
import { Workflow, WorkflowStatus } from '../../models/workflow.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private workflowService = inject(WorkflowService);
  private router = inject(Router);

  currentUser: User | null = null;
  myWorkflows: Workflow[] = [];
  pendingApprovals: Workflow[] = [];
  allWorkflows: Workflow[] = [];
  isLoading = true;
  error: string | null = null;

  WorkflowStatus = WorkflowStatus;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadData();
  }

  loadData(showLoading = true): void {
    if (showLoading) {
      this.isLoading = true;
    }
    this.error = null;

    this.workflowService.getMyWorkflows().subscribe({
      next: (workflows) => {
        this.myWorkflows = workflows;
      },
      error: (err) => {
        this.error = 'Failed to load workflows';
        this.isLoading = false;
      }
    });

    this.workflowService.getPendingApprovals().subscribe({
      next: (workflows) => {
        this.pendingApprovals = workflows;
      },
      error: (err) => {
        this.error = 'Failed to load pending approvals';
        this.isLoading = false;
      }
    });

    this.workflowService.getWorkflows().subscribe({
      next: (workflows) => {
        this.allWorkflows = workflows;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load all workflows';
        this.isLoading = false;
      }
    });
  }

  retry(): void {
    this.loadData();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getStatusClass(status: WorkflowStatus): string {
    switch (status) {
      case WorkflowStatus.APPROVED:
        return 'status-approved';
      case WorkflowStatus.REJECTED:
        return 'status-rejected';
      case WorkflowStatus.PENDING:
        return 'status-pending';
      case WorkflowStatus.IN_PROGRESS:
        return 'status-in-progress';
      case WorkflowStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return 'status-draft';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
