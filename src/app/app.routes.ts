import { Routes } from '@angular/router';

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
    loadComponent: () => import('./pages/agendar-cita/agendar-cita.page').then( m => m.AgendarCitaPage)
  },


  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then( m => m.SearchPage)
  },
  {
    path: 'soporte',
    loadComponent: () =>
      import('./pages/soporte/soporte.page').then((m) => m.SoportePage),
  },

];

