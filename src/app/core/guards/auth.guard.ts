import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function requireAuth(): boolean | UrlTree {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
}

export const authGuard: CanActivateFn = () => requireAuth();
export const authChildGuard: CanActivateChildFn = () => requireAuth();
