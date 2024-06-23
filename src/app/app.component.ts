import { Component } from '@angular/core';
import { DataStorageService } from './service/data-storage.service';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { ExportExpense } from './shared/interfaces.data';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  readonly darkClassName = 'ion-palette-dark';
  constructor(
    protected dataService: DataStorageService) {}


  toggleMode() {
    this.dataService.toggleTheme();
  }  

  private prepareData() {
    const csvExpenses = this.dataService.expenses;
    const categories = this.dataService.categories;
    const joinedExpenses = csvExpenses.reduce((res, exp) => {
      const categoryName = categories.find(cat => cat.id === exp.cat_id);
      if (categoryName) {
        res.push({
          amount: exp.amount,
          categoryName: categoryName.name,
          date: new Date(exp.date).toLocaleDateString(),
        });
      }
      return res;
    }, new Array<ExportExpense>());

    let str = 'amount,category,date\n';
    for (let i = 0; i < joinedExpenses.length; ++i) {
      str += `${joinedExpenses[i].amount},${joinedExpenses[i].categoryName},${joinedExpenses[i].date}\n`;
    }
    return str;
  }

  async exportCSV() {
    try {
      await Filesystem.mkdir({
        path: 'exports/',
        directory: Directory.Documents,
        recursive: true 
      });
    } catch (e) {
      console.warn(e);
    }
    const resultString = this.prepareData();
    try {
        const result = await Filesystem.writeFile({
            path: 'exports/export.csv',
            data: resultString,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
        });
    } catch (e) {
      console.error('Unable to write file', e);
    }
  }
}

