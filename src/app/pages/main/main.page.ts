import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataStorageService } from 'src/app/service/data-storage.service';
import { Category } from 'src/app/shared/interfaces.data';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
})
export class MainPage {
  modalIsOpen = false;
  categoryToAppendTo: Category | null = null;
  modalConfig: {color: string, icon: string, name: string} | null = null;
  form: FormGroup;
  constructor(protected dataService: DataStorageService) { 
    this.form = new FormGroup({
      amount: new FormControl(null, [Validators.required, Validators.min(0)]),
      acc_id: new FormControl(this.dataService.primaryAccount, Validators.required),
      note: new FormControl(null, Validators.maxLength(60)),
      date: new FormControl(this.dataService.startDate, Validators.required)
    });
  }

  addExpenseOpenModal(categoryId: number) {
    this.categoryToAppendTo = this.dataService.categories.find(cat => cat.id === categoryId)!;
    this.modalConfig = {
      color: this.categoryToAppendTo.color_active,
      icon: this.categoryToAppendTo.f_ion_icon,
      name: this.categoryToAppendTo.name
    };
    this.form.patchValue({acc_id: this.dataService.primaryAccount, date: this.dataService.startDate});
    this.modalIsOpen = true;
  }

  appendExpense() {
    this.dataService.addExpense({...this.form.value, cat_id: this.categoryToAppendTo?.id});
    this.form.reset({date: this.dataService.startDate, acc_id: this.dataService.primaryAccount});
    this.modalIsOpen = false;
  }

  cancelAdding() {
    this.form.reset({date: this.dataService.startDate, acc_id: this.dataService.primaryAccount});
    this.modalIsOpen = false;
  }
}
