import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Workflow, WorkflowStatus } from '../../../../models/workflow.model';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.css']
})
export class WorkflowListComponent {
  @Input() workflows: Workflow[] = [];
  @Output() workflowClick = new EventEmitter<string>();

  getStatusClass(status: WorkflowStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  getProgressPercentage(workflow: Workflow): number {
    if (workflow.steps.length === 0) return 0;
    const completedSteps = workflow.steps.filter(
      s => s.status === WorkflowStatus.APPROVED
    ).length;
    return Math.round((completedSteps / workflow.steps.length) * 100);
  }

  onWorkflowClick(workflowId: string): void {
    this.workflowClick.emit(workflowId);
  }

  trackByWorkflowId(index: number, workflow: Workflow): string {
    return workflow.id;
  }
}
