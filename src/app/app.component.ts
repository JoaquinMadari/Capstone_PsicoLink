import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonicModule, RouterModule],
})
export class AppComponent {}




// import { Component } from '@angular/core';
// import { IonicModule, Platform } from '@ionic/angular';
// import { Router, NavigationEnd, RouterModule } from '@angular/router';
// import { filter } from 'rxjs/operators';

// @Component({
//   selector: 'app-root',
//   templateUrl: 'app.component.html',
//   styleUrls: ['app.component.scss'],
//   standalone: true,
//   imports: [IonicModule, RouterModule],
// })
// export class AppComponent {
//   constructor(private platform: Platform, private router: Router) {
//     // Ejecutar cuando la plataforma esté lista
//     this.platform.ready().then(() => {
//       this.applyVisibilityFix();

//       // Aplicar también después de cada navegación
//       this.router.events
//         .pipe(filter((ev) => ev instanceof NavigationEnd))
//         .subscribe(() => {
//           // pequeño delay para que el outlet termine de renderizar
//           setTimeout(() => this.applyVisibilityFix(), 50);
//         });
//     });
//   }

//   private applyVisibilityFix() {
//     const pages = document.querySelectorAll('.ion-page.ion-page-invisible');
//     pages.forEach((el) => {
//       el.classList.remove('ion-page-invisible', 'ion-page-hidden');
//       el.removeAttribute('aria-hidden');
//     });
//     if (pages.length) {
//       console.log(`Parche aplicado: ${pages.length} páginas actualizadas`);
//     } else {
//       console.log('Parche: no se encontraron .ion-page.ion-page-invisible');
//     }
//   }
// }
