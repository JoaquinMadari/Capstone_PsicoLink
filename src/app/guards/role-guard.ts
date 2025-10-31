import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  const access = localStorage.getItem('access') || localStorage.getItem('access_token');
  if (!access) return router.createUrlTree(['/login']);

  const allowed = (route.data?.['roles'] as string[]) || [];
  const role = localStorage.getItem('user_role') || localStorage.getItem('role') || '';

  return !allowed.length || allowed.includes(role)
    ? true
    : router.createUrlTree(['/tabs/home']);
};