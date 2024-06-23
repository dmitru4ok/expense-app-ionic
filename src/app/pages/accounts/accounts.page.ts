import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActionSheetController, IonModal } from '@ionic/angular';
import { DataStorageService } from 'src/app/service/data-storage.service';
import { Account } from 'src/app/shared/interfaces.data';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.page.html',
  styleUrls: ['./accounts.page.scss'],
})
export class AccountsPage {

  accountToEdit: Account | null = null; 
  creationModalIsOpen = false;
  accountModalIsOpen = false;
  mode: "minimized" | "balanceAdd" | "accountEdit" = "minimized";
  editForm: FormGroup;
  balanceForm: FormGroup;
  creationForm: FormGroup;
  formSubmitted = false;
  constructor(protected dataService: DataStorageService, private actionSheetCtrl: ActionSheetController) {
    this.editForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      description: new FormControl(null)
    });
    this.balanceForm = new FormGroup({
      balanceAdded: new FormControl(null, [Validators.required, Validators.min(0)])
    });
    this.creationForm = new FormGroup({
      name: new FormControl<string>('', Validators.required),
      balance: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
      description: new FormControl<string | undefined>(undefined),
      makePrimary: new FormControl<boolean>(false)
    });
  }

  
  // OPEN MODAL ON ACCOUNT CLICK
  openAccountActionsModal(account: Account) {
    this.accountToEdit = {...account};
    this.accountModalIsOpen = true;
  }
  // DISMISS MODAL
  closeAccountActions() {
    this.accountModalIsOpen = false;
    this.accountToEdit = null;
    this.mode = 'minimized';
  }

  // OPEN FORMS
  addBalanceOpen(modal: IonModal) {
    modal.setCurrentBreakpoint(1);
    this.mode = 'balanceAdd';
  }

  editAccountOpen(modal: IonModal) {
    if (this.mode === 'accountEdit') {
      modal.setCurrentBreakpoint(0.6);
      this.editForm.reset();
      this.mode = 'minimized';
    } else {
      modal.setCurrentBreakpoint(1);
      this.mode = 'accountEdit';
      this.editForm.patchValue({
        name: this.accountToEdit?.name,
        description: this.accountToEdit?.description
      });
    }
  }

  // SAVING CHANGES
  addBalance() {
    console.log(this.balanceForm.value);
    this.dataService.depositToAccount(this.accountToEdit?.id!, this.balanceForm.value.balanceAdded);
    this.accountToEdit = null;
    this.editForm.reset();
    this.balanceForm.reset();
    this.accountModalIsOpen = false;
    
  }

  editAccount() {
    console.log(this.editForm.value);
    this.dataService.editAccount({
      ...this.accountToEdit!, 
      name: this.editForm.value.name, 
      description: this.editForm.value.description
    });
    this.accountToEdit = null;
    this.editForm.reset();
    this.balanceForm.reset();
    this.accountModalIsOpen = false;
  }

  canDismiss = async () => {
    if (this.mode === 'minimized' || this.accountToEdit === null) {
      this.editForm.reset();
      this.balanceForm.reset();
      return true;
    }
    return await this.createActionSheet("Close without applying changes?");
  };


  async deleteAccount(modal: IonModal) {
    const willingToDelete = await this.createActionSheet("Delete account? This action is not reversible.");
    console.log(willingToDelete);
    if (willingToDelete) {
      this.dataService.deleteAccount(this.accountToEdit?.id as number);
    }
    this.mode = 'minimized';
    this.editForm.reset();
    this.balanceForm.reset();
    modal.dismiss();
  }

  private async createActionSheet(text: string) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: text,
      buttons: [
        {
          text: 'Yes',
          role: 'confirm',
        },
        {
          text: 'No',
          role: 'cancel',
        },
      ],
    });
    actionSheet.present();
    const {role} = await actionSheet.onWillDismiss();
    return role === 'confirm';
  }


  // CREATE ACCOUNT MODAL
  async cancelCreation() {
    this.creationForm.reset({balance: 0, name: '', description: undefined, makePrimary: false});
    this.formSubmitted = false;
    this.creationModalIsOpen = false;
  }

  canDismissEditForm = async() => {
    if (this.formSubmitted || this.creationForm.pristine && this.creationForm.untouched) {
      this.formSubmitted = false;
      return true;
    } else {
      return await this.createActionSheet('Close without saving changes?');
    }
  }

  async saveChanges() {
    this.formSubmitted = true;
    const {name, balance, description, makePrimary} = this.creationForm.value;
    this.dataService.addAccount(name, description, balance, makePrimary);
    this.creationModalIsOpen = false;
  }
}
