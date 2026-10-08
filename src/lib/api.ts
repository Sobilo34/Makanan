// Makanan Production API Client
// Connects frontend directly to the hardened FastAPI backend

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface User {
  id: string;
  email: string;
  full_name: string;
  student_id?: string | null;
  role: 'student' | 'partner' | 'admin';
  avatar_url?: string | null;
  phone?: string | null;
  university?: string;
  is_active: boolean;
  created_at: string;
}

export interface MealPlan {
  id: string;
  name: string;
  tier: string;
  price_myr: number;
  credits: number;
  description?: string;
  is_active: boolean;
}

export interface Meal {
  id: string;
  partner_id: string;
  name: string;
  description?: string;
  category: string;
  tier: string;
  price_myr: number;
  calories?: number;
  prep_time_minutes?: number;
  rating: number;
  image_url?: string;
  availability: string;
  is_active: boolean;
  redemption_count: number;
  partners?: { id: string; name: string; location?: string };
}

export interface PaymentOrder {
  payment_id: string;
  reference_code: string;
  amount_myr: number;
  credits: number;
  plan_name: string;
  payment_method: string;
  qr_data: string;
  qr_image_url?: string;
  deep_link_url?: string;
  expires_at: string;
  instructions: string;
}

class ApiClient {
  public getToken(): string | null {
    if (typeof window === 'undefined') return null;

    const isValidJwt = (t: any): boolean => {
      if (!t || typeof t !== 'string') return false;
      const parts = t.trim().split('.');
      return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
    };

    // 1. Direct FastAPI token
    const directToken = localStorage.getItem('makanan_token');
    if (isValidJwt(directToken)) return directToken!;

    // 2. Search localStorage for active Supabase session token
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token')) && key.endsWith('-auth-token')) {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (isValidJwt(item?.access_token)) return item.access_token;
          if (isValidJwt(item?.currentSession?.access_token)) return item.currentSession.access_token;
        }
      }
    } catch {}

    // 3. Search document cookies for Supabase auth token
    try {
      const match = document.cookie.match(/sb-[a-z0-9_\-]+-auth-token=([^;]+)/i);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        try {
          const parsed = JSON.parse(decoded);
          if (isValidJwt(parsed?.access_token)) return parsed.access_token;
          if (Array.isArray(parsed) && isValidJwt(parsed[0])) return parsed[0];
        } catch {
          if (isValidJwt(decoded)) return decoded;
        }
      }
    } catch {}

    return null;
  }

  public hasToken(): boolean {
    return !!this.getToken();
  }

  public setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('makanan_token', token);
    }
  }

  public removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('makanan_token');
      localStorage.removeItem('makanan_user');
    }
  }

  public async syncSession(externalToken?: string) {
    const tokenToSend = externalToken || this.getToken();
    if (!tokenToSend) return null;
    try {
      const res = await this.request<{ access_token: string; user: User }>('/auth/sync-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenToSend}`,
        },
      });
      if (res?.access_token) {
        this.setToken(res.access_token);
        this.setUser(res.user);
      }
      return res;
    } catch (e) {
      console.warn('Session sync warning:', e);
      return null;
    }
  }

  public getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem('makanan_user');
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  public setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('makanan_user', JSON.stringify(user));
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorData.error || errorData.message || errorMsg;
      } catch {
        errorMsg = `Server error (${res.status})`;
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  async signup(data: { email: string; password: string; full_name?: string; student_id?: string; role?: string }) {
    const res = await this.request<{ access_token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    this.setUser(res.user);
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    this.setUser(res.user);
    return res;
  }

  async getMe(): Promise<User> {
    const user = await this.request<User>('/auth/me');
    this.setUser(user);
    return user;
  }

  logout() {
    this.removeToken();
  }

  // ── Plans ──────────────────────────────────────────────────────────────────
  async getPlans(): Promise<MealPlan[]> {
    return this.request<MealPlan[]>('/plans');
  }

  // ── Meals ──────────────────────────────────────────────────────────────────
  async getMeals(params?: { category?: string; tier?: string; partner_id?: string }): Promise<Meal[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.tier) query.append('tier', params.tier);
    if (params?.partner_id) query.append('partner_id', params.partner_id);
    const qs = query.toString();
    return this.request<Meal[]>(`/meals${qs ? `?${qs}` : ''}`);
  }

  async getMeal(id: string): Promise<Meal> {
    return this.request<Meal>(`/meals/${id}`);
  }

  // ── Payments (DuitNow QR & E-Wallets) ──────────────────────────────────────
  async createPaymentOrder(planId: string, paymentMethod: string = 'duitnow_qr'): Promise<PaymentOrder> {
    return this.request<PaymentOrder>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod }),
    });
  }

  async getPaymentStatus(referenceCode: string) {
    return this.request<{ reference_code: string; status: string; amount_myr: number; subscription_id?: string }>(
      `/payments/status/${referenceCode}`
    );
  }

  async simulatePaymentSuccess(referenceCode: string) {
    return this.request<{ success: boolean; subscription_id: string }>(
      `/payments/simulate-success/${referenceCode}`,
      { method: 'POST' }
    );
  }

  // ── Redemptions ────────────────────────────────────────────────────────────
  async redeemMeal(subscriptionId: string, mealId: string, partnerId?: string) {
    return this.request<{
      redemption_id: string;
      status: string;
      qr_token: string;
      qr_code: string;
      credits_remaining: number;
      meal_name: string;
      partner_name: string;
    }>('/redemptions/redeem', {
      method: 'POST',
      body: JSON.stringify({
        subscription_id: subscriptionId,
        meal_id: mealId,
        partner_id: partnerId,
      }),
    });
  }

  async getRedemptionHistory() {
    return this.request<any[]>('/redemptions/history');
  }

  // ── Students ───────────────────────────────────────────────────────────────
  async getStudentDashboardSummary() {
    return this.request<{
      user: { id: string; full_name: string; email: string; student_id?: string };
      subscription: any;
      credits_remaining: number;
      credits_used: number;
      total_meals_redeemed: number;
    }>('/students/dashboard-summary');
  }

  async getStudentWallet() {
    return this.request<{
      active_subscription: any;
      credits_remaining: number;
      credits_used: number;
      total_meals_purchased: number;
      recent_transactions: any[];
    }>('/students/wallet');
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request<{ success: boolean; credits_refunded: number }>(
      '/students/cancel-subscription',
      {
        method: 'POST',
        body: JSON.stringify({ subscription_id: subscriptionId }),
      }
    );
  }

  // ── Partners ───────────────────────────────────────────────────────────────
  async partnerApply(data: any) {
    const res = await this.request<{ access_token: string; partner_id: string }>('/partners/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getPartnerProfile() {
    return this.request<any>('/partners/me');
  }

  async verifyQr(qrCodeOrToken: string) {
    return this.request<{
      valid: boolean;
      already_confirmed: boolean;
      student_name: string;
      meal_name: string;
      plan_name: string;
      redemption_id?: string;
      subscription_id?: string;
      credits_remaining?: number;
      partner_id?: string;
      error?: string;
    }>('/partners/verify-qr', {
      method: 'POST',
      body: JSON.stringify({ qr_code_or_token: qrCodeOrToken }),
    });
  }

  async confirmRedemption(redemptionId: string) {
    return this.request<{ success: boolean; redemption_id: string }>(
      '/partners/confirm-redemption',
      {
        method: 'POST',
        body: JSON.stringify({ redemption_id: redemptionId }),
      }
    );
  }

  async getPartnerRedemptions() {
    return this.request<any[]>('/partners/redemptions');
  }

  async getPartnerSettlements() {
    return this.request<{ kpis: any; settlements: any[] }>('/partners/settlements');
  }

  async requestPartnerPayout() {
    return this.request<any>('/partners/request-payout', { method: 'POST' });
  }

  async getPartnerMeals() {
    return this.request<any[]>('/partners/meals');
  }

  async createPartnerMeal(data: any) {
    return this.request<any>('/partners/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  async getAdminOverview() {
    return this.request<{
      total_students: number;
      total_partners: number;
      redemptions_today: number;
      total_revenue_myr: number;
      pending_settlements_count: number;
    }>('/admin/overview');
  }

  async listAdminStudents() {
    return this.request<any[]>('/admin/students');
  }

  async getAdminStudent(id: string) {
    return this.request<any>(`/admin/students/${id}`);
  }

  async listAdminPartners() {
    return this.request<any[]>('/admin/partners');
  }

  async listAdminPayments() {
    return this.request<any[]>('/admin/payments');
  }

  async listAdminSettlements() {
    return this.request<any[]>('/admin/settlements');
  }

  async markSettlementPaid(settlementId: string, reference?: string) {
    return this.request<any>(`/admin/settlements/${settlementId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  }
}

export const api = new ApiClient();
