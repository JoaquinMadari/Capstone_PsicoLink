import { Routes } from '@angular/router';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',

  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },


  {
    path: 'historial',
    loadComponent: () =>
      import('./pages/historial/historial.page').then((m) => m.HistorialPage),
  },
  {
    path: 'detalle-cita/:profesional/:fecha/:hora',
    loadComponent: () =>
      import('./pages/detalle-cita/detalle-cita.page').then(
        (m) => m.DetalleCitaPage
      ),
  },
  {
    path: 'Agendar',
    loadComponent: () => import('./pages/agendar-cita/agendar-cita.page').then( m => m.AgendarCitaPage),
    canActivate: [roleGuard],
    data: { roles: ['paciente'] }
  },


  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then( m => m.SearchPage),
    canActivate: [roleGuard],
    data: { roles: ['paciente'] }
  },
  {
    path: 'soporte',
    loadComponent: () =>
      import('./pages/soporte/soporte.page').then((m) => m.SoportePage),
  },
  {
    path: 'mis-citas',
    loadComponent: () => import('./pages/mis-citas/mis-citas.page').then(m => m.MisCitasPage)
  },
  {
    path: 'profile-setup',
    loadComponent: () => import('./pages/profile-setup/profile-setup.page').then( m => m.ProfileSetupPage),
    canActivate: [roleGuard],
    data: { roles: ['paciente', 'profesional'] }
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },


];

