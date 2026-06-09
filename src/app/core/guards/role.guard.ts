import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserRole } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';

function requireRole(allowedRoles?: UserRole[]): boolean | UrlTree {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!allowedRoles?.length || authService.hasRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/home']);
}

export const roleGuard: CanActivateFn = (route) => {
  return requireRole(route.data['roles'] as UserRole[] | undefined);
};

export const roleChildGuard: CanActivateChildFn = (childRoute) => {
  return requireRole(childRoute.data['roles'] as UserRole[] | undefined);
};
