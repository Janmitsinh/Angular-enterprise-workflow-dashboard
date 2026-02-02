import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkflowService } from '../../../core/services/workflow.service';
import { WorkflowRequest } from '../../../models/workflow.model';
import { UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-create-workflow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-workflow.component.html',
  styleUrls: ['./create-workflow.component.css']
})
export class CreateWorkflowComponent {
  private fb = inject(FormBuilder);
  private workflowService = inject(WorkflowService);
  private router = inject(Router);

  workflowForm: FormGroup;
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  
  readonly approverRoles = [
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.MANAGER, label: 'Manager' },
    { value: UserRole.USER, label: 'User' }
  ];

  constructor() {
    this.workflowForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      steps: this.fb.array([])
    });

    this.addStep();
  }

  get steps(): FormArray {
    return this.workflowForm.get('steps') as FormArray;
  }

  get title() {
    return this.workflowForm.get('title');
  }

  get description() {
    return this.workflowForm.get('description');
  }

  addStep(): void {
    const stepGroup = this.fb.group({
      stepNumber: [this.steps.length + 1, Validators.required],
      approverRole: [UserRole.MANAGER, Validators.required],
      required: [true]
    });

    this.steps.push(stepGroup);
  }

  removeStep(index: number): void {
    if (this.steps.length > 1) {
      this.steps.removeAt(index);
      this.updateStepNumbers();
    }
  }

  private updateStepNumbers(): void {
    this.steps.controls.forEach((control, index) => {
      control.get('stepNumber')?.setValue(index + 1);
    });
  }

  onSubmit(): void {
    if (this.workflowForm.invalid || this.isSubmitting()) {
      Object.keys(this.workflowForm.controls).forEach(key => {
        this.workflowForm.get(key)?.markAsTouched();
      });
      this.steps.controls.forEach(control => {
        Object.keys(control.value).forEach(key => {
          control.get(key)?.markAsTouched();
        });
      });
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.workflowForm.value;
    const workflowRequest: WorkflowRequest = {
      title: formValue.title,
      description: formValue.description,
      steps: formValue.steps
    };

    this.workflowService.createWorkflow(workflowRequest).subscribe({
      next: (workflow) => {
        this.router.navigate(['/dashboard/workflows', workflow.id]);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to create workflow');
        this.isSubmitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
