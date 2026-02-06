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

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
        addAccount() {
            this.accounts.push({
                id: createId(),
                labels: [],
                type: 'LOCAL',
                login: '',
                password: '',
            });
        },
        removeAccount(id: string) {
            this.accounts = this.accounts.filter((account) => account.id !== id);
        },
        updateAccount(id: string, updates: Partial<AccountRecord>) {
            const index = this.accounts.findIndex((account) => account.id === id);
            if (index === -1) {
                return;
            }

            this.accounts[index] = {
                ...this.accounts[index],
                ...updates,
            };
        },
    },
});
