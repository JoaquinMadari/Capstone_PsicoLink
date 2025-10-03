import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar,IonSearchbar,IonItem,IonLabel,
  IonSelectOption ,IonList,IonInfiniteScrollContent,IonInfiniteScroll} from '@ionic/angular/standalone';

import { SearchService } from '../../services/search';



@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,IonSearchbar
    ,IonItem,IonLabel,IonSelectOption ,IonList,IonInfiniteScrollContent,IonInfiniteScroll]
})
export class SearchPage implements OnInit {
  profesionales: any[] = [];
  query = '';
  filters = { specialty: '' };
  ordering = '';
  page = 1;

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    this.loadResults();
  }

  loadResults(event?: any) {
    this.searchService.search(this.query, this.filters, this.ordering, this.page).subscribe(res => {
      if (this.page === 1) {
        this.profesionales = res.results;
      } else {
        this.profesionales.push(...res.results);
      }

      if (event) {
        event.target.complete();
      }
    });
  }

  onSearchChange(event: any) {
    this.query = event.detail.value;
    this.page = 1;
    this.loadResults();
  }

  applyFilter() {
    this.page = 1;
    this.loadResults();
  }

  loadMore(event: any) {
    this.page += 1;
    this.loadResults(event);
  }
}