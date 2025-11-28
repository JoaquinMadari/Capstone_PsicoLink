// src/test-setup.ts
import 'zone.js/testing';

import { IonicModule } from '@ionic/angular';
import { TestBed } from '@angular/core/testing';

// Registrar iconos
import { addIcons } from 'ionicons';
import {
  powerOutline,
  logOutOutline,
  homeOutline,
  menuOutline
} from 'ionicons/icons';

addIcons({
  power: powerOutline,
  logout: logOutOutline,
  home: homeOutline,
  menu: menuOutline
});

// 👉 Configuración GLOBAL para que todos los tests carguen Ionic correctamente
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      IonicModule.forRoot()   // ⭐ NECESARIO PARA NavController
    ]
  });
});

// Silenciar warnings molestos
const origWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('[Ionic Warning]')) return;
  origWarn(...args);
};



