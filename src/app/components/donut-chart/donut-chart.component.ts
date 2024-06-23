import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AgChartOptions } from 'ag-charts-community';
import { Subscription } from 'rxjs';
import { DataStorageService } from 'src/app/service/data-storage.service';
import { MainPagePlotElement } from 'src/app/shared/interfaces.data';


@Component({
  selector: 'donut-chart',
  template: "<ag-charts-angular [options]='chartOptions' [ngStyle]='setup'> </ag-charts-angular>",
  providers: [CurrencyPipe]
})
export class DonutChartComponent implements OnDestroy {

  public chartOptions: AgChartOptions = this.update();
  private sum = '0';
  private subs: Subscription;
  protected setup = {'height': `${this.findConfigForCurrentHeight(window.innerHeight).pie}rem`, 'display': 'block', 'padding': 0};
  constructor(private dataService: DataStorageService, private currency: CurrencyPipe) {
    this.subs = this.dataService.dataChanged$.subscribe((dataArray) => this.update(this.dataService.mainPageCategories));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  findConfigForCurrentHeight(viewport: number) {
   const config = [
        { lower: 0,   upper: 739, pie: 16 }, 
        { lower: 740, upper: 799, pie: 22 },
        { lower: 800, upper: 895, pie: 26 },
        { lower: 900, upper: 999, pie: 28 } 
    ];

    for (let i = 0; i < config.length; i++) {
        if (viewport >= config[i].lower && viewport <= config[i].upper) {
            return config[i]; 
        }
    }
    return config[config.length - 1];
  }

  update(newData?: MainPagePlotElement[]) {
    let fills: string[] = [];
    if (newData) {
      this.sum = this.currency.transform(newData.reduce((s, el) => s + el.totalSum, 0), this.dataService.currency)!;
      fills = newData.map(el => el.colorActive);
    }
   return this.chartOptions = {
      data: newData,
      background: {
        visible: false,
      },
      animation: {
        enabled: true,
        duration: 700
      },
      autoSize: true,
      contextMenu: {
        enabled: false
      },
      series: [
        {
          type: "donut",
          angleKey: "totalSum",
          sectorSpacing: 3,
          sectorLabelKey: 'categoryName',
          sectorLabel: {
            enabled: false
          },
          tooltip: {
            enabled: true,
            renderer: (params) => {
              return {
                title: params.datum.categoryName,
                content: ''
              }
            }
          },
          innerRadiusRatio: 0.9,
          innerRadiusOffset: 33,
          fills,
          innerLabels: [
            {
              text: 'Expenses:',
              margin: 4,
              fontSize: 20,
              color: (this.dataService.isLightMode ? 'black' : 'white'),
            },
            {
              text: this.sum,
              margin: 18,
              fontSize: 26,
              color: '#cb1a27',
            },
          ],
          showInLegend: false,
        },
      ],
    };
  }
}