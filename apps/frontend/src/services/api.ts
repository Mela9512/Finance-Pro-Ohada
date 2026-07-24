import {
  User, Company, JournalEntry, AccountSYSCOHADA, Customer, Supplier, Invoice,
  TreasuryAccount, TreasuryTransaction, FinancialReportBilan, CompteDeResultat, DashboardMetrics,
  Budget, BudgetComparisonRow,
} from '@financepro/shared';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let csrfToken: string | null = null;

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_BASE}/auth/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken as string;
}

function resetCsrfToken() {
  csrfToken = null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };

  if (method !== 'GET') {
    headers['X-CSRF-Token'] = await ensureCsrfToken();
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, method, headers, credentials: 'include' });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message || res.statusText;
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  async login(email: string, password: string): Promise<{ user: User; company: Company }> {
    const result = await request<{ user: User; company: Company }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    resetCsrfToken();
    await ensureCsrfToken();
    return result;
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' });
    resetCsrfToken();
  },

  getMe: () => request<{ user: User; company: Company }>('/auth/me'),

  getMetrics: () => request<DashboardMetrics>('/dashboard/metrics'),

  getAccounts: () => request<AccountSYSCOHADA[]>('/accounting/accounts'),
  getEntries: () => request<JournalEntry[]>('/accounting/entries'),
  createEntry: (dto: Omit<JournalEntry, 'id' | 'entryNumber' | 'isValidated' | 'createdAt' | 'createdBy'>) =>
    request<JournalEntry>('/accounting/entries', { method: 'POST', body: JSON.stringify(dto) }),
  getGrandLivre: (accountCode?: string) =>
    request<any[]>(`/accounting/grand-livre${accountCode ? `?accountCode=${encodeURIComponent(accountCode)}` : ''}`),
  getBalance: () => request<any[]>('/accounting/balance'),

  getBilan: () => request<FinancialReportBilan>('/reports/bilan'),
  getCompteResultat: () => request<CompteDeResultat>('/reports/compte-resultat'),
  getTFT: () => request<any>('/reports/tft'),

  getClients: () => request<Customer[]>('/clients'),
  createClient: (dto: { name: string; nif?: string; phone: string; email: string; address: string; creditLimit: number }) =>
    request<Customer>('/clients', { method: 'POST', body: JSON.stringify(dto) }),

  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (dto: { name: string; nif?: string; phone: string; email: string; address: string }) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(dto) }),

  getTreasuryAccounts: () => request<TreasuryAccount[]>('/treasury/accounts'),
  getTreasuryTransactions: () => request<TreasuryTransaction[]>('/treasury/transactions'),
  createTreasuryTransaction: (dto: Omit<TreasuryTransaction, 'id' | 'status'>) =>
    request<TreasuryTransaction>('/treasury/transactions', { method: 'POST', body: JSON.stringify(dto) }),

  getInvoices: () => request<Invoice[]>('/invoices'),
  createInvoice: (dto: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'amountPaid'>) =>
    request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(dto) }),
  validateInvoice: (id: string) => request<Invoice>(`/invoices/${id}/validate`, { method: 'PUT' }),

  getCompany: () => request<Company>('/admin/company'),
  updateCompany: (dto: Partial<Company>) => request<Company>('/admin/company', { method: 'PUT', body: JSON.stringify(dto) }),
  closeExercice: () => request<Company>('/admin/close-exercice', { method: 'POST' }),
  reopenExercice: () => request<Company>('/admin/reopen-exercice', { method: 'POST' }),
  getUsers: () => request<User[]>('/admin/users'),
  createUser: (dto: { email: string; password: string; name: string; role: string }) =>
    request<User>('/admin/users', { method: 'POST', body: JSON.stringify(dto) }),

  getBudgets: (exercice: number) => request<Budget[]>(`/budget?exercice=${exercice}`),
  getBudgetComparison: (exercice: number) => request<BudgetComparisonRow[]>(`/budget/comparison?exercice=${exercice}`),
  upsertBudget: (dto: { accountCode: string; exercice: number; period?: number; amountBudgeted: number }) =>
    request<Budget>('/budget', { method: 'POST', body: JSON.stringify(dto) }),
  deleteBudget: (id: string) => request<void>(`/budget/${id}`, { method: 'DELETE' }),
};
