import {
  User, Company, JournalEntry, AccountSYSCOHADA, Customer, Supplier, Invoice,
  TreasuryAccount, TreasuryTransaction, FinancialReportBilan, CompteDeResultat, DashboardMetrics,
  Budget, BudgetComparisonRow, FiscalDeclaration, ImportBankStatementResult,
  ExtractedInvoiceDraft, AccountSuggestion, AnomalyReport, CashflowForecast,
  ClientRiskReport, SupplierAlertReport, FinancialVariationExplanation,
  BusinessPlan, CreateBusinessPlanDto, SuggestedHypotheses, CompanyProfileSuggestion,
} from '@financepro/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

  async register(dto: { name: string; email: string; password: string; companyName: string }): Promise<{ user: User; company: Company }> {
    const result = await request<{ user: User; company: Company }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
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

  forgotPassword: (email: string) => request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  getInvite: (token: string) => request<{ email: string; role: string; companyName: string }>(`/auth/invite/${token}`),
  async acceptInvite(dto: { token: string; name: string; password: string }): Promise<{ user: User; company: Company }> {
    const result = await request<{ user: User; company: Company }>('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    resetCsrfToken();
    await ensureCsrfToken();
    return result;
  },

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
  downloadBilanPdf: () => downloadFile('/reports/bilan/pdf', 'bilan.pdf'),
  downloadCompteResultatPdf: () => downloadFile('/reports/compte-resultat/pdf', 'compte-resultat.pdf'),

  getFiscalDeclaration: (year: number, month: number) =>
    request<FiscalDeclaration>(`/reports/declaration-fiscale?year=${year}&month=${month}`),
  downloadFiscalDeclarationPdf: (year: number, month: number) =>
    downloadFile(`/reports/declaration-fiscale/pdf?year=${year}&month=${month}`, `declaration-fiscale-${year}-${month}.pdf`),

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
  importBankStatement: (treasuryAccountId: string, csvContent: string) =>
    request<ImportBankStatementResult>(`/treasury/accounts/${treasuryAccountId}/import-statement`, {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    }),

  getInvoices: () => request<Invoice[]>('/invoices'),
  createInvoice: (dto: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'amountPaid'>) =>
    request<Invoice>('/invoices', { method: 'POST', body: JSON.stringify(dto) }),
  validateInvoice: (id: string) => request<Invoice>(`/invoices/${id}/validate`, { method: 'PUT' }),
  downloadInvoicePdf: (id: string, invoiceNumber: string) => downloadFile(`/invoices/${id}/pdf`, `${invoiceNumber}.pdf`),

  getCompany: () => request<Company>('/admin/company'),
  updateCompany: (dto: Partial<Company>) => request<Company>('/admin/company', { method: 'PUT', body: JSON.stringify(dto) }),
  closeExercice: () => request<Company>('/admin/close-exercice', { method: 'POST' }),
  reopenExercice: () => request<Company>('/admin/reopen-exercice', { method: 'POST' }),
  getUsers: () => request<User[]>('/admin/users'),
  createUser: (dto: { email: string; password: string; name: string; role: string }) =>
    request<User>('/admin/users', { method: 'POST', body: JSON.stringify(dto) }),
  inviteUser: (dto: { email: string; role: string }) =>
    request<{ message: string }>('/admin/invite', { method: 'POST', body: JSON.stringify(dto) }),
  completeOnboarding: (dto: Partial<Company>) =>
    request<Company>('/admin/onboarding', { method: 'POST', body: JSON.stringify(dto) }),

  getBudgets: (exercice: number) => request<Budget[]>(`/budget?exercice=${exercice}`),
  getBudgetComparison: (exercice: number) => request<BudgetComparisonRow[]>(`/budget/comparison?exercice=${exercice}`),
  upsertBudget: (dto: { accountCode: string; exercice: number; period?: number; amountBudgeted: number }) =>
    request<Budget>('/budget', { method: 'POST', body: JSON.stringify(dto) }),
  deleteBudget: (id: string) => request<void>(`/budget/${id}`, { method: 'DELETE' }),

  aiExtractInvoice: (fileBase64: string, mimeType: string) =>
    request<ExtractedInvoiceDraft>('/ai/invoice-ocr', { method: 'POST', body: JSON.stringify({ fileBase64, mimeType }) }),
  aiSuggestAccount: (wording: string) => request<AccountSuggestion>(`/ai/suggest-account?wording=${encodeURIComponent(wording)}`),
  aiGetAnomalies: () => request<AnomalyReport>('/ai/anomalies'),
  aiChat: (question: string, currentScreen?: string) =>
    request<{ answer: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ question, currentScreen }) }),
  aiGetCashflowForecast: () => request<CashflowForecast>('/ai/cashflow-forecast'),
  aiGetClientsRisk: () => request<ClientRiskReport>('/ai/clients-risk'),
  aiGetSuppliersOverdue: () => request<SupplierAlertReport>('/ai/suppliers-overdue'),
  aiExplainVariation: () => request<FinancialVariationExplanation>('/ai/explain-variation'),
  aiSuggestBudget: (accountCode: string, exercice: number) =>
    request<{ accountCode: string; basedOnYear: number; suggestedAmount: number }>(
      `/ai/suggest-budget?accountCode=${encodeURIComponent(accountCode)}&exercice=${exercice}`,
    ),
  aiSuggestCompanyProfile: (
    companyName: string,
    sector: string,
    legalFormOptions: string[],
    taxRegimeOptions: string[],
    moduleOptions: { id: string; label: string }[],
  ) =>
    request<CompanyProfileSuggestion>('/ai/suggest-company-profile', {
      method: 'POST',
      body: JSON.stringify({ companyName, sector, legalFormOptions, taxRegimeOptions, moduleOptions }),
    }),

  getBusinessPlans: () => request<BusinessPlan[]>('/business-plan'),
  getBusinessPlan: (id: string) => request<BusinessPlan>(`/business-plan/${id}`),
  createBusinessPlan: (dto: CreateBusinessPlanDto) =>
    request<BusinessPlan>('/business-plan', { method: 'POST', body: JSON.stringify(dto) }),
  deleteBusinessPlan: (id: string) => request<void>(`/business-plan/${id}`, { method: 'DELETE' }),
  suggestBusinessPlanHypotheses: (title: string, description: string) =>
    request<SuggestedHypotheses>('/business-plan/suggest-hypotheses', { method: 'POST', body: JSON.stringify({ title, description }) }),
  downloadBusinessPlanPdf: (id: string) => downloadFile(`/business-plan/${id}/pdf`, `business-plan-${id}.pdf`),
};
