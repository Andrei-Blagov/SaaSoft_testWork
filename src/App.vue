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

            <div v-if="accounts.length === 0" class="empty-state">Добавьте учетную запись</div>

            <div v-for="account in accounts" :key="account.id" class="account-row">
                <div class="field" :class="errorClass(account.id, 'labels')">
                    <el-input v-model="labelInputs[account.id]" placeholder="Метки" maxlength="50" show-word-limit
                        @blur="() => handleLabelBlur(account.id)" />
                    <span v-if="errors[account.id]?.labels" class="error-text">{{ errors[account.id]?.labels }}</span>
                </div>

                <div class="field" :class="errorClass(account.id, 'type')">
                    <el-select v-model="typeInputs[account.id]" placeholder="Выберите"
                        @change="(value: AccountType) => handleTypeChange(account.id, value)">
                        <el-option label="LDAP" value="LDAP" />
                        <el-option label="Локальная" value="LOCAL" />
                    </el-select>
                    <span v-if="errors[account.id]?.type" class="error-text">{{ errors[account.id]?.type }}</span>
                </div>

                <div class="field" :class="errorClass(account.id, 'login')">
                    <el-input v-model="loginInputs[account.id]" placeholder="Логин" maxlength="100" show-word-limit
                        @blur="() => handleLoginBlur(account.id)" />
                    <span v-if="errors[account.id]?.login" class="error-text">{{ errors[account.id]?.login }}</span>
                </div>

                <div class="field" :class="errorClass(account.id, 'password')">
                    <template v-if="typeInputs[account.id] === 'LOCAL'">
                        <el-input v-model="passwordInputs[account.id]" placeholder="Пароль" maxlength="100"
                            show-word-limit show-password @blur="() => handlePasswordBlur(account.id)" />
                        <span v-if="errors[account.id]?.password" class="error-text">{{ errors[account.id]?.password
                            }}</span>
                    </template>
                    <template v-else>
                        <span class="error-text" v-if="errors[account.id]?.password">{{ errors[account.id]?.password
                            }}</span>
                    </template>
                </div>

                <button class="delete-button" type="button" @click="handleRemove(account.id)">🗑️</button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useAccountStore, type AccountRecord, type AccountType, type LabelToken } from './store/accounts';

interface FieldErrors {
    labels?: string;
    type?: string;
    login?: string;
    password?: string;
}

const store = useAccountStore();
const accounts = computed(() => store.accounts);

const labelInputs = reactive<Record<string, string>>({});
const loginInputs = reactive<Record<string, string>>({});
const passwordInputs = reactive<Record<string, string>>({});
const typeInputs = reactive<Record<string, AccountType>>({});
const errors = reactive<Record<string, FieldErrors>>({});

const ensureLocalState = (account: AccountRecord) => {
    if (!(account.id in labelInputs)) {
        labelInputs[account.id] = labelsToString(account.labels);
    }
    if (!(account.id in loginInputs)) {
        loginInputs[account.id] = account.login;
    }
    if (!(account.id in passwordInputs)) {
        passwordInputs[account.id] = account.password ?? '';
    }
    if (!(account.id in typeInputs)) {
        typeInputs[account.id] = account.type;
    }
    if (!(account.id in errors)) {
        errors[account.id] = {};
    }
};

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

const errorClass = (id: string, field: keyof FieldErrors) => {
    return errors[id]?.[field] ? 'error-border' : '';
};

const handleAdd = () => {
    store.addAccount();
};

const handleRemove = (id: string) => {
    store.removeAccount(id);
    delete labelInputs[id];
    delete loginInputs[id];
    delete passwordInputs[id];
    delete typeInputs[id];
    delete errors[id];
};

const handleLabelBlur = (id: string) => {
    const value = labelInputs[id] ?? '';
    const error = validateLabels(value);
    setError(id, 'labels', error);
    if (error) {
        return;
    }
    store.updateAccount(id, { labels: parseLabels(value) });
};

const handleLoginBlur = (id: string) => {
    const value = loginInputs[id] ?? '';
    const error = validateLogin(value);
    setError(id, 'login', error);
    if (error) {
        return;
    }
    store.updateAccount(id, { login: value.trim() });
};

const handlePasswordBlur = (id: string) => {
    const value = passwordInputs[id] ?? '';
    const type = typeInputs[id];
    const error = validatePassword(value, type);
    setError(id, 'password', error);
    if (error) {
        return;
    }
    store.updateAccount(id, { password: type === 'LDAP' ? null : value });
};

const handleTypeChange = (id: string, value: AccountType) => {
    const error = validateType(value);
    setError(id, 'type', error);
    if (error) {
        return;
    }
    typeInputs[id] = value;
    if (value === 'LDAP') {
        passwordInputs[id] = '';
        setError(id, 'password', '');
        store.updateAccount(id, { type: value, password: null });
        return;
    }
    store.updateAccount(id, { type: value, password: passwordInputs[id] ?? '' });
};

watch(
    accounts,
    (newAccounts) => {
        newAccounts.forEach((account) => ensureLocalState(account));
    },
    { immediate: true }
);

onMounted(() => {
    store.loadFromStorage();
    store.$subscribe(() => {
        store.saveToStorage();
    });
});
</script>
