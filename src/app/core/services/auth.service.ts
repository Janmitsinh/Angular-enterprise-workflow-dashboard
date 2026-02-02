import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { User, UserRole, AuthResponse, LoginCredentials } from '../../models/user.model';
import { AuditLogService } from './audit-log.service';
import { AuditActionType } from '../../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auditLogService = inject(AuditLogService);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Mock users for demonstration
  private mockUsers: (User & { password: string })[] = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      createdAt: new Date()
    },
    {
      id: '2',
      username: 'manager',
      password: 'manager123',
      email: 'manager@example.com',
      role: UserRole.MANAGER,
      firstName: 'Manager',
      lastName: 'User',
      createdAt: new Date()
    },
    {
      id: '3',
      username: 'user',
      password: 'user123',
      email: 'user@example.com',
      role: UserRole.USER,
      firstName: 'Regular',
      lastName: 'User',
      createdAt: new Date()
    }
  ];

  constructor() {
    // Check for stored token on initialization
    const token = this.getToken();
    if (token) {
      const user = this.getUserFromToken(token);
      if (user) {
        this.currentUserSubject.next(user);
      }
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Simulate API call
    return of(credentials).pipe(
      delay(500),
      map(creds => {
        const user = this.mockUsers.find(
          u => u.username === creds.username && u.password === creds.password
        );
        
        if (!user) {
          throw new Error('Invalid credentials');
        }

        const { password, ...userWithoutPassword } = user;
        const token = this.generateToken(userWithoutPassword);
        
        return {
          token,
          user: userWithoutPassword,
          expiresIn: 3600
        };
      }),
      tap(response => {
        this.setToken(response.token);
        this.currentUserSubject.next(response.user);
        this.auditLogService.log(AuditActionType.LOGIN, 'User', response.user.id);
      })
    );
  }

  logout(): void {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      this.auditLogService.log(AuditActionType.LOGOUT, 'User', currentUser.id);
    }
    this.removeToken();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private generateToken(user: User): string {
    // In a real app, this would be a JWT from the server
    return btoa(JSON.stringify(user));
  }

  private getUserFromToken(token: string): User | null {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  getToken$(): string | null {
    return this.getToken();
  }
}
