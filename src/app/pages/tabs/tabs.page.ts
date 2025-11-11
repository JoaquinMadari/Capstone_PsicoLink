import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonLabel, IonIcon, IonTabButton, IonTabBar, IonTabs, IonRouterOutlet} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, IonLabel, IonIcon, IonTabButton, IonTabBar, IonTabs, IonRouterOutlet]
})
export class TabsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  onTabWillChange() {
    const el = document.activeElement as HTMLElement | null;
    if (el && typeof el.blur === 'function') el.blur();
  }
}
