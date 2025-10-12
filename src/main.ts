import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { provideHttpClient } from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { LOCALE_ID } from '@angular/core';

// Registra el locale de Chile
registerLocaleData(localeEsCl, 'es-CL');

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    { provide: LOCALE_ID, useValue: 'es-CL' },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
  ],
});
