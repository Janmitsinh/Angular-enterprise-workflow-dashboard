import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component')
          .then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'workflows',
    canActivate: [authGuard],
    children: [
      {
        path: 'create',
        loadComponent: () => import('./features/workflows/create-workflow/create-workflow.component')
          .then(m => m.CreateWorkflowComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/workflows/workflow-detail/workflow-detail.component')
          .then(m => m.WorkflowDetailComponent)
      }
    ]
  },
  {
    path: 'audit',
    loadComponent: () => import('./features/audit/audit.component')
      .then(m => m.AuditComponent),
    canActivate: [authGuard, roleGuard(UserRole.ADMIN, UserRole.MANAGER)]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
