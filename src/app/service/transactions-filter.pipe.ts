import { Pipe, PipeTransform } from '@angular/core';
import { TransactionsEntry } from '../shared/interfaces.data';
import { DataStorageService } from './data-storage.service';

@Pipe({
  name: 'transactionsFilter',
  standalone: true
})
export class TransactionsFilterPipe implements PipeTransform {
  constructor(private dataService: DataStorageService) {}
  transform(value: Array<TransactionsEntry>, noteExists: boolean, noteStr: string, 
  categoryArray: boolean[], accArray: boolean[]): Array<TransactionsEntry> {
    if (value.length === 0) return [];

    const catIndicesArray = this.dataService.categories.reduce((res, el, ind) => {
      if (categoryArray[ind]) res.push(el.id);
      return res;
    }, new Array<number>());
    const accIndicesArray = this.dataService.accounts.reduce((res, el, ind) => {
      if (accArray[ind]) res.push(el.id);
      return res;
    }, new Array<number>());
    const result: Array<TransactionsEntry> = [];
    value.forEach(dateEntry => {
      const filteredEntries = dateEntry.transactions.filter((transaction) => {

        const noteCheck = !noteExists || (transaction.note && transaction.note.toLowerCase().includes(noteStr));
        const categoryCheck = (catIndicesArray.length === 0) || catIndicesArray.includes(transaction.cat_id);
        const accCheck = (accIndicesArray.length === 0) || accIndicesArray.includes(transaction.acc_id);
        return noteCheck && categoryCheck && accCheck;
      });

      if (filteredEntries.length > 0) {
        const sum = filteredEntries.reduce((s, elem) => s + elem.amount, 0);
        result.push({...dateEntry, transactions: filteredEntries, sum})
      }
    });
    return result;
  }

}
