import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs-pro',
  templateUrl: './tabs-pro.page.html',
  styleUrls: ['./tabs-pro.page.scss'],
  standalone: true,
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule]
})
export class TabsProPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  onTabWillChange() {
    const el = document.activeElement as HTMLElement | null;
    if (el && typeof el.blur === 'function') el.blur();
  }
}
