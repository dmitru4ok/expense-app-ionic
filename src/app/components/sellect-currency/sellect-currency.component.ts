import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DataStorageService } from 'src/app/service/data-storage.service';
import { Currency } from 'src/app/shared/interfaces.data';

@Component({
  selector: 'app-sellect-currency',
  templateUrl: './sellect-currency.component.html',
  styleUrls: ['./sellect-currency.component.scss'],
})
export class SellectCurrencyComponent {

  constructor(private navCtrl: NavController, protected dataService: DataStorageService) { }
  private static LOCATIONS = ["AUD", "GBP", "CAD", "CHY", "EUR", "JPY", "CHF", "UAH", "USD"];
  protected selectedCurrency: Currency = this.dataService.currency;
  get locations() {
    return SellectCurrencyComponent.LOCATIONS;
  }

  setCurrency() {
    this.navCtrl.back({animated: true});
    this.dataService.setCurrency(this.selectedCurrency);
  }
}
