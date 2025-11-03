// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'splash', pathMatch: 'full' },

  // públicas
  { path: 'splash',   loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage) },
  { path: 'login',    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },

  // *** Tabs: SOLO las 3 pestañas principales ***
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      { path: 'home',     loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage), canActivate: [roleGuard] },
      { path: 'messages', loadComponent: () => import('./pages/messages/messages.page').then(m => m.MessagesPage), canActivate: [roleGuard] },
      { path: 'account',  loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage), canActivate: [roleGuard] },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // *** Páginas fuera de tabs (sin barra) ***
  { path: 'agendar',     loadComponent: () => import('./pages/agendar-cita/agendar-cita.page').then(m => m.AgendarCitaPage), canActivate: [roleGuard], data: { roles: ['paciente'] } },
  { path: 'search',      loadComponent: () => import('./pages/search/search.page').then(m => m.SearchPage),                 canActivate: [roleGuard], data: { roles: ['paciente'] } },
  { path: 'mis-citas',   loadComponent: () => import('./pages/mis-citas/mis-citas.page').then(m => m.MisCitasPage),         canActivate: [roleGuard] },
  { path: 'historial',   loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage),         canActivate: [roleGuard] },
  { path: 'soporte',     loadComponent: () => import('./pages/soporte/soporte.page').then(m => m.SoportePage),               canActivate: [roleGuard] },
  { path: 'detalle-cita/:profesional/:fecha/:hora', loadComponent: () => import('./pages/detalle-cita/detalle-cita.page').then(m => m.DetalleCitaPage), canActivate: [roleGuard] },
  { path: 'profile-setup', loadComponent: () => import('./pages/profile-setup/profile-setup.page').then(m => m.ProfileSetupPage) }, // fuera de tabs
  { path: 'profile/:id', loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage), canActivate: [roleGuard] },

  // chat fuera de tabs
  { path: 'chat/conversation/:conversationId', loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage), canActivate: [roleGuard] },
  { path: 'chat/with/:otherUid',               loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage), canActivate: [roleGuard] },
  { path: 'chat',                               loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage), canActivate: [roleGuard] },

  // compat (rutas viejas → nuevas fuera de tabs)
  { path: 'Agendar', redirectTo: 'agendar', pathMatch: 'full' },
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
  {
    path: 'exitoso',
    loadComponent: () => import('./pago/exitoso/exitoso.page').then( m => m.ExitosoPage)
  },
  {
    path: 'fallido',
    loadComponent: () => import('./pago/fallido/fallido.page').then( m => m.FallidoPage)
  },
  {
    path: 'pendiente',
    loadComponent: () => import('./pago/pendiente/pendiente.page').then( m => m.PendientePage)
  },


  // fallback
  { path: '**', redirectTo: 'tabs/home' },
];

