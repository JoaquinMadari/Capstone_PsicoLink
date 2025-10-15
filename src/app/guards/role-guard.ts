import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';


export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const allowed = (route.data?.['roles'] as string[]) || [];
  const role = localStorage.getItem('role') ?? '';
  return !allowed.length || allowed.includes(role) ? true : router.parseUrl('/home');
};
