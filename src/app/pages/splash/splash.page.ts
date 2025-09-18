import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
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
