import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { MainPage } from './pages/main/main.page';
import { TransactionsPage } from './pages/transactions/transactions.page';
import { BottomTabsComponent } from './components/bottom-toolbar/bottom-toolbar.component';
import { SelectDayComponent } from './pages/select-day/select-day.component';
import { SellectCurrencyComponent } from './components/sellect-currency/sellect-currency.component';
import { AccountsPage } from './pages/accounts/accounts.page';

const routes: Routes = [
  {
    path: '',
    component: BottomTabsComponent,
    children: [
      {path: 'categories', component: MainPage},
      {path: 'accounts', component: AccountsPage},
      {path: 'transactions', component: TransactionsPage},
      {path: 'set-day', component: SelectDayComponent},
      {path: 'set-currency', component: SellectCurrencyComponent},
      {path: '**', redirectTo: 'categories'}
    ]
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
