import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActionSheetController, IonItemSliding } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { DataStorageService } from 'src/app/service/data-storage.service';
import { TransactionsFilterPipe } from 'src/app/service/transactions-filter.pipe';
import { TransactionsEntry } from 'src/app/shared/interfaces.data';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  providers: [TransactionsFilterPipe]
})
export class TransactionsPage implements OnDestroy {
  form: FormGroup;
  subscriptions: Subscription[] = [];
  expenseToedit: {
    id: number, cat_id: number, amount: number, name: string,
    color: string, icon: string, note?: string
  } | null = null;
  modalIsOpen = false;
  filteringModalIsOpen = false;
  protected categorySelectedArray = new Array<boolean>().fill(false);
  protected noteFilter: string = '';
  protected noteExists = false;
  protected accountSelectedArray = new Array<boolean>(this.dataService.accounts.length).fill(false);
  protected transactionEntriesArray: Array<TransactionsEntry> = [];

  constructor(
    protected dataService: DataStorageService,
    private asCtrl: ActionSheetController, 
    private filterPipe: TransactionsFilterPipe
  ) {
   
    this.form = new FormGroup({
      amount: new FormControl(null, [Validators.required, Validators.min(0)]),
      acc_id: new FormControl(null, Validators.required),
      note: new FormControl(null, Validators.maxLength(60)),
      date: new FormControl(null, Validators.required),
      category: new FormControl(null, Validators.required)
    });
    const modalAppearanceSub = this.form.get('category')!.valueChanges
      .subscribe(value => {
        const category = this.dataService.getCategoryInfo(value)!;
        this.expenseToedit = {
          ...this.expenseToedit!,
          cat_id: category.id,
          name: category.name,
          color: category.color_active,
          icon: category.f_ion_icon
        };
      });
    const filteringSub = this.dataService.dataChanged$.subscribe(() => this.updateTransactions());
    this.subscriptions.push(filteringSub);
    this.subscriptions.push(modalAppearanceSub);
  }

  openFilteringModal() {
    this.filteringModalIsOpen = true;
  }

  filteringModalDismissed() {
    this.updateTransactions();
    this.filteringModalIsOpen = false;
  }

  updateTransactions() {
    this.transactionEntriesArray = this.filterPipe.transform(this.dataService.transactionsArray, 
      this.noteExists, 
      this.noteFilter, 
      this.categorySelectedArray, this.accountSelectedArray);
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(subs => subs.unsubscribe());
  }

  watchNoteChanges(eventData: string) {
    if (eventData) this.noteExists = true;
    this.noteFilter = eventData.toLowerCase();
  }

  get filteringIsActive() {
    return this.noteExists || this.noteFilter || this.accountSelectedArray.some(el => el === true) 
      || this.categorySelectedArray.some(el => el === true);
  }

  clearFiltering() {
    this.noteExists = false;
    this.noteFilter = '';
    this.accountSelectedArray.fill(false);
    this.categorySelectedArray.fill(false);
    this.filteringModalIsOpen = false;
  }

  async removeExpence(id: number) {
    const deleteSheet = await this.asCtrl.create({
      header: 'Delete transaction?',
      buttons: [
        {
          text: 'Yes',
          role: 'confirm'
        },
        {
          text: 'No',
          role: 'cancel'
        }
      ]
    });
    deleteSheet.present();
    const {role} = await deleteSheet.onWillDismiss();
    if (role === 'confirm') {
      this.dataService.removeExpense(id);
    }
  }

  async editExpenseOpenModal(id: number) {
    const expense = this.dataService.getExpenseInfo(id);
    if (expense) {
      const category = this.dataService.getCategoryInfo(expense.cat_id);
      if (category) {
        this.expenseToedit = {
          id: expense.id,
          amount: expense.amount,
          cat_id: expense.cat_id,
          name: category.name,
          color: category.color_active,
          icon: category.f_ion_icon,
          note: expense.note,
        };
        this.form.patchValue({
          amount: expense.amount,
          date: new Date(expense.date).toISOString(),
          acc_id: this.dataService.accounts.map(acc => acc.id).includes(expense.acc_id) ? expense.acc_id : null,
          note: expense.note,
          category: expense.cat_id
        });
        this.modalIsOpen = true;
      }
    }
  }

  cancelEditing() {
    this.modalIsOpen = false;
    this.expenseToedit = null;
  }

  confirmChanges() {
    this.dataService.editExpense(this.expenseToedit?.id!, this.form.value);
    this.modalIsOpen = false;
    this.expenseToedit = null;
   
  }

  async toggleOptions(slidingItem: IonItemSliding) {
    slidingItem.getOpenAmount().then(totalOpen => {
      if (totalOpen > 0) {
        slidingItem.close();
      } else {
        slidingItem.open('end');
      }
    });
  }
}
