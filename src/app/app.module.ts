import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TopToolbarComponent } from './components/top-toolbar/top-toolbar.component';
import { DatePipe } from '@angular/common';
import { MainPage } from './pages/main/main.page';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DonutChartComponent } from './components/donut-chart/donut-chart.component';
import { AgChartsAngularModule } from 'ag-charts-angular';
import { AgCharts } from 'ag-charts-enterprise';
import { BottomTabsComponent } from './components/bottom-toolbar/bottom-toolbar.component';
import { TransactionsPage } from './pages/transactions/transactions.page';
import { DateChoiceModalComponent } from './components/date-choice-modal/date-choice-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectDayComponent } from './pages/select-day/select-day.component';
import { Drivers } from '@ionic/storage';
import { IonicStorageModule } from '@ionic/storage-angular';
import { SellectCurrencyComponent } from './components/sellect-currency/sellect-currency.component';
import { AccountsPage } from './pages/accounts/accounts.page';
import { TransactionsFilterPipe } from './service/transactions-filter.pipe';

AgCharts.setLicenseKey('your license key');




@NgModule({
    declarations: [
        AppComponent, 
        MainPage, 
        TransactionsPage, 
        DonutChartComponent, 
        BottomTabsComponent,
        TopToolbarComponent,
        DateChoiceModalComponent,
        SelectDayComponent,
        SellectCurrencyComponent,
        AccountsPage
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, 
        DatePipe,
        provideHttpClient(withInterceptorsFromDi())
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule, 
        IonicModule.forRoot(), 
        AppRoutingModule, 
        AgChartsAngularModule, 
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        IonicStorageModule.forRoot({name: 'expense-app-storage', driverOrder: [ Drivers.SecureStorage, Drivers.IndexedDB, Drivers.LocalStorage]}),
        TransactionsFilterPipe
    ]
})
export class AppModule {}
