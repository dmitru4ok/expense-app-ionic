import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { DataStorageService } from 'src/app/service/data-storage.service';


@Component({
  selector: 'date-choice-modal',
  templateUrl: './date-choice-modal.component.html',
  styleUrls: ['./date-choice-modal.component.scss'],
})
export class DateChoiceModalComponent {
  @Input({required: true}) trigger_id!: string;

  constructor(
    private router: Router, 
    private modalCtrl: ModalController,
    private dataSerivce: DataStorageService) {}

  selectToday() {
    this.modalCtrl.dismiss();
    this.dataSerivce.setToday();
  }

  selectDay() {
    this.modalCtrl.dismiss();
    console.log(`${this.trigger_id} modal dismissed!`);
    this.router.navigate(['/set-day'], {queryParams: {range: 0}});
  }
  
  selectRange() {
    this.modalCtrl.dismiss();
    this.router.navigate(['/set-day'], {queryParams: {range: 1}});
  }

  selectWeek() {
    this.modalCtrl.dismiss();
    this.dataSerivce.setWeek();
  }

  selectMonth() {
    this.modalCtrl.dismiss();
    this.dataSerivce.setMonth();
  }

  selectYear() {
    this.modalCtrl.dismiss();
    this.dataSerivce.setYear();
  }

  selectAllTime() {
    this.modalCtrl.dismiss();
    this.dataSerivce.setAllTime();
  }
}
