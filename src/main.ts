import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { provideHttpClient, withInterceptors  } from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { LOCALE_ID } from '@angular/core';
import { addIcons } from 'ionicons';
import { personCircle, personCircleOutline, call, documentText, homeOutline, 
  chatbubblesOutline,personOutline,calendarOutline,settingsOutline, 
  power, chatbubbles, personAdd} from 'ionicons/icons';

import { authInterceptor } from './app/interceptors/auth-interceptor';


addIcons({
  personCircle,
  personCircleOutline,
  call,
  documentText,
  homeOutline,
  chatbubblesOutline,
  personOutline,
  calendarOutline,
  settingsOutline,
  power,
  chatbubbles,
  personAdd
});


// Registra el locale de Chile
registerLocaleData(localeEsCl, 'es-CL');

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});
