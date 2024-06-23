export enum RangeType {
    DAY,
    WEEK,
    MONTH,
    YEAR,
    ALL_TIME,
    RANGE
};

export type Currency = "AUD" | "GBP" | "CAD" |
    "CHY" | "EUR" | "JPY" | "CHF" | "UAH" | "USD";

export type UserConfig = {
    currency: Currency;
    lastCategoryId: number;
    lastAccountId: number;
    lightMode: boolean;
    primaryAccountId: number;
};

export type Category = {
    id: number;
    name: string;
    f_ion_icon: string;
    color_active: string;
    color: string;
};

export type Expense = {
    id: number;
    cat_id: number;
    acc_id: number;
    date: number;
    amount: number;
    note?: string;
};

export type MainPagePlotElement = {
    catId: number; 
    iconName: string;
    categoryName: string; 
    totalSum: number; 
    colorActive: string; 
    color: string;
}

export type CategoryExtended = {
    id: number;
    cat_id: number;
    acc_id: number;
    date: string;
    category: string;
    amount: number;
    color: string;
    icon: string;
    note?: string;
};

export type TransactionsEntry = { 
    date: Date, 
    sum: number, 
    transactions: Array<CategoryExtended> 
}

export type Account = {
    id: number;
    name: string;
    balance: number;
    icon: string;
    description?: string;
}

export type InitRequest =  { 
    categories: Category[] | null; 
    expenses: Expense[] | null; 
    config: UserConfig | null; 
    accounts: Account[] | null; 
}

export type ExportExpense = {
    amount: number;
    categoryName: string;
    date: string;
}

