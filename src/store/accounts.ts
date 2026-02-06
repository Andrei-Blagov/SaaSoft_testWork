import { defineStore } from 'pinia';

export type AccountType = 'LDAP' | 'LOCAL';

export interface LabelToken {
    text: string;
}

export interface AccountRecord {
    id: string;
    labels: LabelToken[];
    type: AccountType;
    login: string;
    password: string | null;
}

const STORAGE_KEY = 'account-records';

export const useAccountStore = defineStore('accounts', {
    state: () => ({
        accounts: [] as AccountRecord[],
    }),
    actions: {
        loadFromStorage() {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return;
            }

            try {
                const parsed = JSON.parse(raw) as AccountRecord[];
                if (Array.isArray(parsed)) {
                    this.accounts = parsed;
                }
            } catch {
                this.accounts = [];
            }
        },
        saveToStorage() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.accounts));
        },
        upsertAccount(account: AccountRecord) {
            const index = this.accounts.findIndex((item) => item.id === account.id);
            if (index === -1) {
                this.accounts.push(account);
                return;
            }
            this.accounts[index] = account;
        },
        removeAccount(id: string) {
            this.accounts = this.accounts.filter((account) => account.id !== id);
        },
    },
});
