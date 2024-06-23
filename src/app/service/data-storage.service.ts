import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import {
  Account,
  Category,
  Currency,
  Expense,
  MainPagePlotElement,
  RangeType,
  UserConfig,
  InitRequest,
  TransactionsEntry,
  CategoryExtended
} from '../shared/interfaces.data';
import { Storage } from '@ionic/storage-angular';
import { DOCUMENT, DatePipe } from '@angular/common';
import {
  startOfWeek, addWeeks, startOfYear,
  addYears, differenceInDays, addMonths,
  startOfMonth, addDays, startOfDay, subDays,
  subMonths,
  subYears
} from 'date-fns';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, forkJoin, from, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {
  // utilities 
  readonly darkClassName = 'ion-palette-dark';
  private renderer: Renderer2 = this.rendereFactory.createRenderer(null, null);

  // Database and config
  private config: UserConfig = { currency: "EUR", lastCategoryId: 8, lastAccountId: 2, lightMode: false, primaryAccountId: 1 };
  private database!: Storage;

  // Categories 
  private _categories: Category[] = [];
  private selectedCategories: Category[] = [];

  // expenses
  private _expenses: Expense[] = [];
  private expensesInScope: Expense[] = [];

  // Chosen range state management
  private startRangeDate: Date = new Date();
  private endRangeDate: Date = new Date();
  private _stringFormattedDate: string | null = '';
  private difference: number = 0;
  private rangeType: RangeType = RangeType.DAY;

  // Subject to update plot
  private _dataChanged$: ReplaySubject<void> = new ReplaySubject(1);

  // visual data to display
  private _transactionsArray: Array<TransactionsEntry> = [];
  private _mainPageCategories: MainPagePlotElement[] = [];
  private _accounts: Account[] = [];




  constructor(
    private databaseManager: Storage,
    private datePipe: DatePipe,
    private rendereFactory: RendererFactory2,
    private http: HttpClient,
    @Inject(DOCUMENT) private doc: Document) {
    from(this.initStorage()).pipe(
      switchMap(() => forkJoin(
        {
          categories: from(this.database.get('categories')),
          expenses: from(this.database.get('expenses')),
          config: from(this.database.get('config')),
          accounts: from(this.database.get('accounts'))
        }
      )),
      switchMap(({categories, expenses, config, accounts}: InitRequest) => {
        this._expenses = expenses || [];
        let catBackup: Observable<Category[] | null> = this.http.get<Category[]>('assets/data/categories.json');
        let accBackup: Observable<Account[] | null> = this.http.get<Account[]>('assets/data/accounts.json');
        let confBackup: Observable<UserConfig | null> = this.http.get<UserConfig>('assets/data/config.json');
        if (categories) {
          this._categories = categories;
          this.selectedCategories = [...categories];
          catBackup = of(null);
        }
        if (accounts) {
          this._accounts = accounts;
          accBackup = of(null);
        }
        if (config) {
          this.config = config;
          confBackup = of(null);
        }
        return forkJoin({ categoriesBackup: catBackup, accountsBackup: accBackup, configBackup: confBackup });
      }),
      tap(({ accountsBackup, categoriesBackup, configBackup }) => {
        if (categoriesBackup) {
          this.database.set('categories', categoriesBackup);
          this._categories = categoriesBackup;
          this.selectedCategories = [...categoriesBackup];
        }
        if (configBackup) {
          this.database.set('config', configBackup);
          this.config = configBackup;
        }
        if (accountsBackup) {
          this.database.set('accounts', accountsBackup);
          this._accounts = accountsBackup;
        }
        this.setLightTheme(this.config.lightMode);
        this.setToday();
      })).subscribe();
  }

  async initStorage() {
    this.database = await this.databaseManager.create();
  }

  get disableShiftButtons() {
    return this.rangeType === RangeType.ALL_TIME;
  }

  get categories() {
    return this.selectedCategories.map(cat => { return { ...cat } });
  }

  get mainPageCategories() {
    return this._mainPageCategories.map(mpc => { return { ...mpc } });
  }

  get stringFormattedDate() {
    return this._stringFormattedDate;
  }

  get accounts() {
    return this._accounts.map(acc => { return { ...acc } });
  }

  get dataChanged$() {
    return this._dataChanged$;
  }

  get transactionsArray(): TransactionsEntry[] {
    return this._transactionsArray.map(dateEntry => {
      return { ...dateEntry, transactions: dateEntry.transactions.map(transaction => { return { ...transaction } }) }
    });
  }

  get accountsTotal() {
    return this._accounts.reduce((s, el) => s + el.balance, 0);
  }

  private setDifference() {
    this.difference = differenceInDays(this.endRangeDate, this.startRangeDate);
  }

  // EXPENSE MANIPULATION METHODS 
  public addExpense(expenseTemplate: { amount: number, note?: string, cat_id: number, date: string, acc_id: number }) {
    const newExpense = {
      id: ++this.config.lastCategoryId,
      cat_id: expenseTemplate.cat_id,
      acc_id: expenseTemplate.acc_id,
      date: new Date(expenseTemplate.date).getTime(),
      amount: expenseTemplate.amount,
      note: expenseTemplate.note
    };
    this._expenses = [newExpense, ...this._expenses];
    this.depositToAccount(newExpense.acc_id, -newExpense.amount);
    from(this.database.set('expenses', this._expenses)).pipe(
      switchMap(() => {
        return forkJoin([
          from(this.database.set('config', this.config)), 
          from(this.database.set('accounts', this._accounts))
        ])
      }),
      tap(() => {
        this.changeExpensesInScope();
      })
    ).subscribe();
  }

  removeExpense(id: number) {
    const toRemove = this._expenses.findIndex(exp => exp.id === id);
    if (toRemove !== -1) {
      const {acc_id, amount} = this._expenses[toRemove];
      this.depositToAccount(acc_id, amount);
      this._expenses.splice(toRemove, 1);
      from(this.database.set('expenses', this._expenses)).pipe(
        switchMap(() => this.database.set('accounts', this._accounts))
      ).subscribe(() => this.changeExpensesInScope());
    }
  }

  editExpense(id: number, newExpense: any) {
    const expense = this.getExpenseInfo(id);
    if (expense) {
      const oldValues = {...expense};
      expense.note = newExpense.note;
      expense.amount = newExpense.amount;
      expense.acc_id = newExpense.acc_id;
      expense.cat_id = newExpense.category;
      expense.date = new Date(newExpense.date).getTime();      
      if (expense.acc_id === oldValues.acc_id) {
        const difference = expense.amount - oldValues.amount;
        this.depositToAccount(expense.acc_id, -difference);
      } else {
        this.depositToAccount(oldValues.acc_id, oldValues.amount);
        this.depositToAccount(expense.acc_id, -expense.amount);
      }
      from(this.database.set('expenses', this._expenses)).pipe(
        switchMap(() => from(this.database.set('accounts', this._accounts)))
      ).subscribe(() => this.changeExpensesInScope());
    }
  }

  getExpenseInfo(id: number) {
    return this._expenses.find(exp => exp.id === id);
  }

  get expenses() {
    return this.expensesInScope.map(exp => {return {...exp}});
  }

  // ACCOUNT MANIPULATION METHODS
  async addAccount(name: string, description: string, balance: number, setprimary: boolean) {
    this._accounts.push({
      id: ++this.config.lastAccountId,
      name,
      balance,
      description,
      icon: 'logo-usd'
    });
    this.database.set('accounts', this._accounts).then(() => {
      if (setprimary) {
        this.setPrimaryAccount(this.config.lastAccountId);
        console.log(this.accounts, this.config);
      } else {
        this.database.set('config', this.config);
      }
    });
  }

  editAccount(account: Account) {
    const index = this._accounts.findIndex(acc => acc.id === account.id);
    if (index >= 0) {
      this._accounts[index] = { ...account };
      this.database.set('accounts', this._accounts);
    }
  }

  depositToAccount(id: number, amount: number) {
    const account = this.getAccountInfo(id);
    if (account) account.balance += amount;
    this.database.set('accounts', this._accounts);
  }

  deleteAccount(id: number) {
    const index = this.accounts.findIndex(acc => acc.id === id);
    if (index >= 0) {
      this._accounts.splice(index, 1);
      this.config.primaryAccountId = this._accounts[0].id;
      this.database.set('accounts', this._accounts);
      this.database.set('config', this.config);
    }
  }

  private getAccountInfo(id: number) {
    return this._accounts.find(acc => acc.id === id);
  }


  get lastAccountId() {
    return this.config.lastAccountId;
  }

  // CONFIG MANIPULATION METHODS
  setCurrency(currency: Currency) {
    this.config.currency = currency;
    this.database.set('config', this.config);
    this._dataChanged$.next();
  }

  public setPrimaryAccount(id: number) {
    if (this._accounts.find(acc => acc.id === id)) {
      this.config.primaryAccountId = id;
      this.database.set('config', this.config);
    }
  }

  private setLightTheme(isLight: boolean) {
    if (isLight) {
      this.renderer.removeClass(this.doc.documentElement, this.darkClassName);
    } else {
      this.renderer.addClass(this.doc.documentElement, this.darkClassName);
    }
    this.config.lightMode = isLight;
    this.database.set('config', this.config).then(() => {
      this._dataChanged$.next();
    });
  }

  public toggleTheme() {
    this.setLightTheme(!this.config.lightMode);
  }

  get currency() {
    return this.config.currency;
  }

  get isLightMode() {
    return this.config.lightMode;
  }

  get primaryAccount() {
    return this.config.primaryAccountId;
  }

  // CATEGORY MANIPULATION METHODS
  getCategoryInfo(id: number) {
    return this._categories.find(cat => cat.id === id);
  }

  // METHODS FOR MANIPULATING RANGE
  get startDate() {
    this.startRangeDate.getTimezoneOffset();
    return this.startRangeDate.toISOString();
  }
  setDay(day: Date) {
    this.rangeType = RangeType.DAY;
    this.startRangeDate = startOfDay(new Date(day));
    this.endRangeDate = addDays(this.startRangeDate, 1);
    this.changeExpensesInScope();
    this.formatDispalyingString();
  }

  setRange(date_start: string, date_end: string) {
    this.rangeType = RangeType.RANGE;
    this.startRangeDate = startOfDay(new Date(date_start));
    this.endRangeDate = addDays(startOfDay(new Date(date_end)), 1);
    this.changeExpensesInScope();
    this.formatDispalyingString();
  }

  setToday() {
    this.rangeType = RangeType.DAY;
    this.startRangeDate = startOfDay(new Date());
    this.endRangeDate = addDays(this.startRangeDate, 1);
    this.changeExpensesInScope();
    this.formatDispalyingString();

  }

  setWeek() {
    this.startRangeDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    this.endRangeDate = addWeeks(this.startRangeDate, 1);
    this.rangeType = RangeType.WEEK;
    this.changeExpensesInScope();
    this.formatDispalyingString();
  }

  setMonth() {
    this.rangeType = RangeType.MONTH;
    this.startRangeDate = startOfMonth(new Date());
    this.endRangeDate = addMonths(this.startRangeDate, 1);
    this.changeExpensesInScope();
    this.formatDispalyingString();
  }

  setYear() {
    this.startRangeDate = startOfYear(new Date());
    this.endRangeDate = addYears(this.startRangeDate, 1);
    this.rangeType = RangeType.YEAR;
    this.changeExpensesInScope();
    this.formatDispalyingString();
  }

  setAllTime() {
    if (this._expenses.length > 0) {
      let max = this._expenses[0].date;
      let min = this._expenses[0].date;
      for (let i = 1; i < this._expenses.length; ++i) {
        const date = this._expenses[i].date;
        if (date > max) { max = date; }
        if (date < min) { min = date; }
      }
      this.startRangeDate = startOfDay(new Date(min));
      this.endRangeDate = addDays(new Date(max), 1);
    } else {
      this.startRangeDate = startOfDay(new Date());
      this.endRangeDate = addDays(this.startRangeDate, 1);
    }
    this.rangeType = RangeType.ALL_TIME;
    this.formatDispalyingString();
    this.changeExpensesInScope();
  }

  // 1 day/month/week/year/rage forward
  public shiftDatesRight() {
    switch (this.rangeType) {
      case RangeType.DAY:
      case RangeType.RANGE:
      case RangeType.WEEK: {
        this.startRangeDate = addDays(this.startRangeDate, this.difference);
        this.endRangeDate = addDays(this.endRangeDate, this.difference);
        break;
      }
      case RangeType.MONTH: {
        this.startRangeDate = addMonths(this.startRangeDate, 1);
        this.endRangeDate = addMonths(this.endRangeDate, 1);
        break;
      }
      case RangeType.YEAR: {
        this.startRangeDate = addYears(this.startRangeDate, 1);
        this.endRangeDate = addYears(this.endRangeDate, 1);
        break;
      }
    }
    this.changeExpensesInScope();
    this.formatDispalyingString();
  }

  // 1 day/month/week/year/rage backward
  public shiftDatesLeft() {
    switch (this.rangeType) {
      case RangeType.DAY:
      case RangeType.RANGE:
      case RangeType.WEEK: {
        this.startRangeDate = subDays(this.startRangeDate, this.difference);
        this.endRangeDate = subDays(this.endRangeDate, this.difference);
        break;
      }
      case RangeType.MONTH: {
        this.startRangeDate = subMonths(this.startRangeDate, 1);
        this.endRangeDate = subMonths(this.endRangeDate, 1);
        break;
      }
      case RangeType.YEAR: {
        this.startRangeDate = subYears(this.startRangeDate, 1);
        this.endRangeDate = subYears(this.endRangeDate, 1);
        break;
      }
    }
    this.changeExpensesInScope();
    this.formatDispalyingString();
  }


  // VISUAL DATA PREPARATION METHODS
  // Filter data 
  private changeExpensesInScope() {
    this.expensesInScope = [];
    this.expensesInScope = this._expenses.filter((element) =>
      (element.date >= this.startRangeDate.getTime() && element.date < this.endRangeDate.getTime()));
    this.prepareTransactions();
  }

  // aggregate data
  prepareTransactions() {
    this._mainPageCategories = this.selectedCategories.map<MainPagePlotElement>((value: Category) => {
      return {
        catId: value.id,
        categoryName: value.name,
        iconName: value.f_ion_icon,
        totalSum: this.expensesInScope.reduce((acc, exp: Expense) => (exp.cat_id === value.id ? acc + exp.amount : acc), 0),
        color: value.color,
        colorActive: value.color_active
      };
    });

    // ANALOG OF SQL JOIN
    const extendedCategories = this.expensesInScope.map<CategoryExtended>((expense) => {
      const category = this.selectedCategories.find((cat) => cat.id === expense.cat_id)!;
      return {
        id: expense.id,
        cat_id: category.id,
        acc_id: expense.acc_id,
        date: this.datePipe.transform(expense.date, 'YYYY-MM-dd')!,
        category: category.name,
        note: expense.note,
        amount: expense.amount,
        color: category.color_active,
        icon: category.f_ion_icon
      };
    });

    const dateToExtendedCategory = extendedCategories.reduce((data, transaction) => {
      if (!data.get(transaction.date)) {
        data.set(transaction.date, new Array<CategoryExtended>());
      }
      data.get(transaction.date)!.push({ ...transaction });
      return data;
    }, new Map<string, CategoryExtended[]>());

    const transactionEntriesArray: TransactionsEntry[] = new Array<TransactionsEntry>(dateToExtendedCategory.size);
    let i = 0;
    dateToExtendedCategory.forEach((transactions, dateStr) => {
      transactionEntriesArray[i++] = {
        date: new Date(dateStr),
        transactions,
        sum: transactions.reduce((s, tr) => s + tr.amount, 0)
      };
    });
    this._transactionsArray = transactionEntriesArray.sort((entry1, entry2) => entry1.date < entry2.date ? 1 : -1);
    this._dataChanged$.next();
  }

  // format string to display in top toolbar
  private formatDispalyingString() {
    this.setDifference();
    switch (this.rangeType) {
      case RangeType.RANGE: {
        this._stringFormattedDate = `${this.datePipe.transform(this.startRangeDate)} - ${this.datePipe.transform(subDays(this.endRangeDate, 1))}`;
        return;
      }
      case RangeType.ALL_TIME: {
        this._stringFormattedDate = 'ALL TIME';
        return;
      }
      case RangeType.DAY: {
        this._stringFormattedDate = this.datePipe.transform(this.startRangeDate);
        return;
      }
      case RangeType.YEAR: {
        this._stringFormattedDate = this.startRangeDate.getFullYear().toString();
        return;
      }
      case RangeType.WEEK: {
        if (
          this.startRangeDate.getFullYear() < this.startRangeDate.getFullYear() ||
          this.startRangeDate.getMonth() < this.endRangeDate.getMonth()) {
          this._stringFormattedDate = `${this.datePipe.transform(this.startRangeDate)} - ${this.datePipe.transform(subDays(this.endRangeDate, 1))}`;
          return;
        }
        this._stringFormattedDate = `${this.datePipe.transform(this.startRangeDate, 'MMM dd')?.toUpperCase()} - ${this.datePipe.transform(subDays(this.endRangeDate, 1))}`;
        return;
      }
      case RangeType.MONTH: {
        this._stringFormattedDate = `${this.datePipe.transform(this.startRangeDate, 'MMM yyyy')?.toUpperCase()}`;
        return;
      }
    }
  }
}
