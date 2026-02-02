import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLog, AuditActionType } from '../../models/audit-log.model';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent implements OnInit {
  private auditLogService = inject(AuditLogService);
  private fb = inject(FormBuilder);

  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  isLoading = true;
  error: string | null = null;

  filterForm: FormGroup;
  actionTypes = Object.values(AuditActionType);

  constructor() {
    this.filterForm = this.fb.group({
      action: [''],
      entityType: [''],
      startDate: [''],
      endDate: ['']
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.error = null;

    this.auditLogService.getRecentLogs(100).subscribe({
      next: (logs) => {
        this.logs = logs;
        this.filteredLogs = logs;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load audit logs';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredLogs = this.logs.filter(log => {
      if (filters.action && log.action !== filters.action) {
        return false;
      }
      if (filters.entityType && log.entityType.toLowerCase() !== filters.entityType.toLowerCase()) {
        return false;
      }
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (new Date(log.timestamp) < startDate) {
          return false;
        }
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(log.timestamp) > endDate) {
          return false;
        }
      }
      return true;
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  retry(): void {
    this.loadLogs();
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  getActionClass(action: AuditActionType): string {
    switch (action) {
      case AuditActionType.LOGIN:
      case AuditActionType.APPROVE:
      case AuditActionType.CREATE_WORKFLOW:
        return 'action-success';
      case AuditActionType.LOGOUT:
      case AuditActionType.VIEW_WORKFLOW:
        return 'action-info';
      case AuditActionType.REJECT:
      case AuditActionType.CANCEL_WORKFLOW:
        return 'action-warning';
      default:
        return 'action-default';
    }
  }
}
