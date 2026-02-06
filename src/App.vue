<template>
    <div class="account-page">
        <header class="page-header">
            <div class="page-title">Учетные записи</div>
            <el-button type="primary" @click="handleAdd">+</el-button>
        </header>

        <div class="hint">
            <span>ℹ️</span>
            <span>
                Для указания нескольких меток используйте разделитель <strong>;</strong>. Поле "Метка"
                необязательное и не более 50 символов.
            </span>
        </div>

        <section class="account-table">
            <div class="account-header">
                <span>Метки</span>
                <span>Тип записи</span>
                <span>Логин</span>
                <span>Пароль</span>
                <span></span>
            </div>

            <div v-if="rows.length === 0" class="empty-state">Добавьте учетную запись</div>

            <div v-for="row in rows" :key="row.id" class="account-row">
                <div class="field" :class="errorClass(row.id, 'labels')">
                    <el-input v-model="row.labelInput" placeholder="Метки" maxlength="50" show-word-limit
                        @blur="() => handleCommit(row.id)" />
                    <span v-if="errors[row.id]?.labels" class="error-text">{{ errors[row.id]?.labels }}</span>
                </div>

                <div class="field" :class="errorClass(row.id, 'type')">
                    <el-select v-model="row.type" placeholder="Выберите" @change="() => handleCommit(row.id, true)">
                        <el-option label="LDAP" value="LDAP" />
                        <el-option label="Локальная" value="LOCAL" />
                    </el-select>
                    <span v-if="errors[row.id]?.type" class="error-text">{{ errors[row.id]?.type }}</span>
                </div>

                <div class="field" :class="errorClass(row.id, 'login')">
                    <el-input v-model="row.login" placeholder="Логин" maxlength="100" show-word-limit
                        @blur="() => handleCommit(row.id)" />
                    <span v-if="errors[row.id]?.login" class="error-text">{{ errors[row.id]?.login }}</span>
                </div>

                <div class="field" :class="errorClass(row.id, 'password')">
                    <template v-if="row.type === 'LOCAL'">
                        <el-input v-model="row.password" placeholder="Пароль" maxlength="100" show-word-limit
                            show-password @blur="() => handleCommit(row.id)" />
                        <span v-if="errors[row.id]?.password" class="error-text">{{ errors[row.id]?.password }}</span>
                    </template>
                    <template v-else>
                        <span class="error-text" v-if="errors[row.id]?.password">{{ errors[row.id]?.password }}</span>
                    </template>
                </div>

                <button class="delete-button" type="button" @click="handleRemove(row.id)">🗑️</button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useAccountStore, type AccountRecord, type AccountType, type LabelToken } from './store/accounts';

interface FieldErrors {
    labels?: string;
    type?: string;
    login?: string;
    password?: string;
}

interface AccountDraft {
    id: string;
    labelInput: string;
    type: AccountType;
    login: string;
    password: string;
}

const store = useAccountStore();
const rows = ref<AccountDraft[]>([]);
const errors = reactive<Record<string, FieldErrors>>({});

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const labelsToString = (labels: LabelToken[]) => labels.map((label) => label.text).join('; ');

const parseLabels = (value: string) =>
    value
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ text: item }));

const validateLabels = (value: string) => {
    if (value.length > 50) {
        return 'Максимум 50 символов.';
    }
    return '';
};

const validateLogin = (value: string) => {
    if (!value.trim()) {
        return 'Поле обязательно.';
    }
    if (value.length > 100) {
        return 'Максимум 100 символов.';
    }
    return '';
};

const validatePassword = (value: string, type: AccountType) => {
    if (type === 'LDAP') {
        return '';
    }
    if (!value.trim()) {
        return 'Поле обязательно.';
    }
    if (value.length > 100) {
        return 'Максимум 100 символов.';
    }
    return '';
};

const validateType = (value?: AccountType) => {
    if (!value) {
        return 'Поле обязательно.';
    }
    return '';
};

const setError = (id: string, field: keyof FieldErrors, message: string) => {
    errors[id] = { ...errors[id], [field]: message || undefined };
};

const errorClass = (id: string, field: keyof FieldErrors) => (errors[id]?.[field] ? 'error-border' : '');

const createDraftFromAccount = (account: AccountRecord): AccountDraft => ({
    id: account.id,
    labelInput: labelsToString(account.labels),
    type: account.type,
    login: account.login,
    password: account.password ?? '',
});

const ensureErrors = (id: string) => {
    if (!(id in errors)) {
        errors[id] = {};
    }
};

const handleAdd = () => {
    const newDraft: AccountDraft = {
        id: createId(),
        labelInput: '',
        type: 'LOCAL',
        login: '',
        password: '',
    };
    rows.value.push(newDraft);
    ensureErrors(newDraft.id);
};

const handleRemove = (id: string) => {
    rows.value = rows.value.filter((row) => row.id !== id);
    store.removeAccount(id);
    delete errors[id];
};

const validateRow = (row: AccountDraft) => {
    const labelError = validateLabels(row.labelInput);
    const typeError = validateType(row.type);
    const loginError = validateLogin(row.login);
    const passwordError = validatePassword(row.password, row.type);

    setError(row.id, 'labels', labelError);
    setError(row.id, 'type', typeError);
    setError(row.id, 'login', loginError);
    setError(row.id, 'password', passwordError);

    return !labelError && !typeError && !loginError && !passwordError;
};

const handleCommit = (id: string, isTypeChange = false) => {
    const row = rows.value.find((item) => item.id === id);
    if (!row) {
        return;
    }

    if (isTypeChange && row.type === 'LDAP') {
        row.password = '';
    }

    const isValid = validateRow(row);
    if (!isValid) {
        return;
    }

    const record: AccountRecord = {
        id: row.id,
        labels: parseLabels(row.labelInput),
        type: row.type,
        login: row.login.trim(),
        password: row.type === 'LDAP' ? null : row.password,
    };

    store.upsertAccount(record);
};

onMounted(() => {
    store.loadFromStorage();
    rows.value = store.accounts.map((account) => createDraftFromAccount(account));
    rows.value.forEach((row) => ensureErrors(row.id));
    store.$subscribe(() => {
        store.saveToStorage();
    });
});
</script>
