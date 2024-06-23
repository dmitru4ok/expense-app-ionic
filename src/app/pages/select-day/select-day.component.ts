import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataStorageService } from 'src/app/service/data-storage.service';

@Component({
  selector: 'app-select-day',
  templateUrl: './select-day.component.html',
  styleUrls: ['./select-day.component.scss'],
})
export class SelectDayComponent  {
  date!: string | string[] | undefined;
  isRange: boolean = false;
  dateTemp: string[] = [];
  constructor(
    private location: Location, 
    private dataService: DataStorageService) {
      this.isRange = inject(ActivatedRoute).snapshot.queryParams['range'] === '1';
  }

  cancel() {
    this.location.back();
  }

  confirm() {
    if (this.isRange) {
      this.dataService.setRange((this.date as string[])[0], (this.date as string[])[1]);
    } else {
      this.dataService.setDay(new Date((this.date as string).split('T')[0]));  
    }
    this.location.back();
  }

  changesMonitor(data: string[] | string) {
    if (this.isRange && data instanceof Array && data.length === 2) {
      this.dateTemp = [...data.sort()];
    } 
   
    if (this.isRange && this.date && data instanceof Array && data.length > 2) {
      data.sort();
      if (this.date[0] !== this.dateTemp[0]) {
        this.date = [this.date[0], this.date[2]];
      } else if ((this.date[1] !== this.dateTemp[1])) {
        this.date = [this.date![1], this.date![2]];
      } else {
        this.date = [this.date![0], this.date![2]];
      }
      this.dateTemp = [...this.date];
    }
  }

  disableButton() {
    if (this.isRange && this.date) return (<string[]>this.date).length < 2;
   return !this.date;
  }
}
