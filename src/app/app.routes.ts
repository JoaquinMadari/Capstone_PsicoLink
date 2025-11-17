// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'splash', pathMatch: 'full' },

  // públicas
  { path: 'splash',   loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage) },
  { path: 'login',    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },

  // *** Tabs paciente: SOLO las 3 pestañas principales ***
  {
    path: 'tabs',
    canMatch: [roleGuard],
    data: { roles: ['paciente'] },
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      { path: 'home',     loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage), canActivate: [roleGuard] },
      { path: 'messages', loadComponent: () => import('./pages/messages/messages.page').then(m => m.MessagesPage), canActivate: [roleGuard] },
      { path: 'account',  loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage), canActivate: [roleGuard] },
      
      { path: 'chat/with/:otherUid', loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage) },
      { path: 'chat/conversation/:conversationId', loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage) },
      
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // *** Tabs profesional: SOLO las 4 pestañas principales ***
  {
    path: 'pro',
    canActivate: [roleGuard],
    data: { roles: ['profesional'] },
    loadComponent: () => import('./pages/tabs-pro/tabs-pro.page').then(m => m.TabsProPage),
    children: [
      { path: 'home',      loadComponent: () => import('./pages/home-pro/home-pro.page').then(m => m.HomeProPage) },
      { path: 'mis-citas', loadComponent: () => import('./pages/mis-citas/mis-citas.page').then(m => m.MisCitasPage) },
      { path: 'messages',  loadComponent: () => import('./pages/messages/messages.page').then(m => m.MessagesPage) },
      { path: 'account',   loadComponent: () => import('./pages/account/account.page').then(m => m.AccountPage) },

      { path: 'chat/with/:otherUid', loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage) },
      { path: 'chat/conversation/:conversationId', loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage) },

      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ]
  },

  // *** Páginas fuera de tabs (sin barra) ***
  { 
    path: 'agendar',
    loadComponent: () => import('./pages/agendar-cita/agendar-cita.page').then(m => m.AgendarCitaPage),
    canActivate: [roleGuard],
    data: { roles: ['paciente'] }
  },
  { 
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then(m => m.SearchPage),
    canActivate: [roleGuard],
    data: { roles: ['paciente'] }
  },
  { 
    path: 'mis-citas',
    loadComponent: () => import('./pages/mis-citas/mis-citas.page').then(m => m.MisCitasPage),
    canActivate: [roleGuard]
  },
  { 
    path: 'historial',
    loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage),
    canActivate: [roleGuard]
  },
  {
    path: 'soporte',
    loadComponent: () => import('./pages/soporte/soporte.page').then(m => m.SoportePage),
    canActivate: [roleGuard] 
  },
  { 
    path: 'detalle-cita/:profesional/:fecha/:hora',
    loadComponent: () => import('./pages/detalle-cita/detalle-cita.page').then(m => m.DetalleCitaPage),
    canActivate: [roleGuard]
  },
  { 
    path: 'profile-setup',
    loadComponent: () => import('./pages/profile-setup/profile-setup.page').then(m => m.ProfileSetupPage),
    canActivate: [roleGuard],
    data: { roles: ['paciente', 'profesional'] } 
  },
  { 
    path: 'profile/:id',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [roleGuard]
  },

  // compat (rutas viejas → nuevas fuera de tabs)
  { path: 'Agendar', redirectTo: 'agendar', pathMatch: 'full' },

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

  {
    path: 'mis-tickets',
    loadComponent: () => import('./pages/mis-tickets/mis-tickets.page').then( m => m.MisTicketsPage),
    canActivate: [roleGuard]
  },
  {
    path: 'detalle-ticket/:id',
    loadComponent: () => import('./pages/detalle-ticket/detalle-ticket.page').then( m => m.DetalleTicketPage),
    canActivate: [roleGuard]
  },

  //ADMIN
  {
    path: 'admin/tickets/:id/responder',
    loadComponent: () => import('./pages/admin/tickets/tickets.page').then( m => m.TicketsPage),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  },

  {
    path: 'admin/ticket-list',
    loadComponent: () => import('./pages/admin/ticket-list/ticket-list.page').then( m => m.TicketListPage),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  },

  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/admin/dashboard/dashboard.page').then( m => m.DashboardPage),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  },

  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin/users/users.page').then( m => m.UsersPage),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  },

  {
    path: 'admin/users/:id',
    loadComponent: () => import('./pages/admin/user-detail/user-detail.page').then( m => m.UserDetailPage),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }
  },

  // fallback (evita loop con guards si no hay sesión)
  { path: '**', redirectTo: 'splash' },  

  
];

