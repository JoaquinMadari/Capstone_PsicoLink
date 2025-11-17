import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const authService = inject(Auth);

  const access = localStorage.getItem('access') || localStorage.getItem('access_token');
  if (!access) return router.createUrlTree(['/login']);

  await authService.initSupabaseSession();

  const allowed = (route.data?.['roles'] as string[]) || [];
  const role = localStorage.getItem('user_role') || localStorage.getItem('role') || '';
  const isStaff = localStorage.getItem('user_is_staff') === 'true';

  if (allowed.includes('admin')) {
    // Permitir el acceso SI el usuario es staff (administrador)
    if (isStaff) {
      return true;
    }
  }

  return !allowed.length || allowed.includes(role)
    ? true
    : router.createUrlTree(['/tabs/home']);
};