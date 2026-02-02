# Angular Enterprise Workflow Dashboard

A comprehensive Angular application for managing approval workflows with role-based access control, multi-step approvals, and audit logging.

## Features

- **Role-based Access Control**: Support for Admin, Manager, and User roles
- **Multi-step Approval Flows**: Configurable approval workflows with multiple stages
- **Audit Logs**: Complete tracking of who approved what and when
- **Reactive Forms**: Form validation using Angular's reactive forms
- **Lazy-loaded Modules**: Optimized loading with lazy-loaded feature modules
- **Guards & Resolvers**: Route protection and data pre-fetching
- **Error Handling**: Comprehensive error states with retry mechanisms

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 21+

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

### Testing

```bash
npm test
```

## Project Structure

```
src/
├── app/
│   ├── core/           # Core services, guards, interceptors
│   ├── features/       # Feature modules (lazy-loaded)
│   │   ├── auth/       # Authentication
│   │   ├── dashboard/  # Dashboard
│   │   ├── workflows/  # Workflow management
│   │   └── audit/      # Audit logs
│   ├── shared/         # Shared components, directives, pipes
│   └── models/         # TypeScript interfaces and models
```

## Architecture

- **Authentication**: JWT-based authentication with role management
- **State Management**: Service-based state management with RxJS
- **HTTP Interceptors**: Token injection and error handling
- **Route Guards**: Authentication and authorization guards
- **Lazy Loading**: Feature modules loaded on demand

## License

MIT
