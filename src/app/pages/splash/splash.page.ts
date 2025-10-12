import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';



@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent,IonSpinner]
})
export class SplashPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  console.log('SplashPage initialized');
  setTimeout(() => {
      this.router.navigateByUrl('/login');
    }, 3000); // 3000 milisegundos = 3 segundos
}

}
