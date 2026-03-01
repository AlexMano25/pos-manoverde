import type {
  ApiResponse,
  Order,
  PaginatedResponse,
  Product,
  StockMove,
  Store,
  User,
} from '../types'

// ---------------------------------------------------------------------------
// API Service -- HTTP client for the POS backend
//
// Supports two modes:
//   1. Local backend (Express/Fastify running on the same LAN or localhost)
//   2. Supabase REST (when configured via env vars)
//
// All methods return `ApiResponse<T>` so callers can handle errors uniformly.
// When the network is unavailable, callers should fall back to Dexie (IndexedDB).
// ---------------------------------------------------------------------------

const SERVER_URL_KEY = 'pos-server-url'
const AUTH_TOKEN_KEY = 'pos-auth-token'

// ---- URL helpers -----------------------------------------------------------

export function getServerUrl(): string {
  return (
    localStorage.getItem(SERVER_URL_KEY) ||
    window.location.origin
  )
}

export function setServerUrl(url: string): void {
  // Normalise: strip trailing slash
  const cleaned = url.replace(/\/+$/, '')
  localStorage.setItem(SERVER_URL_KEY, cleaned)
}

// ---- Auth helpers ----------------------------------------------------------

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

// ---- Generic fetch wrapper -------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const base = getServerUrl()
  const url = `${base}${path}`

  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    })

    if (!res.ok) {
      let errorMessage: string
      try {
        const body = await res.json()
        errorMessage =
          (body as Record<string, unknown>).error as string ||
          (body as Record<string, unknown>).message as string ||
          res.statusText
      } catch {
        errorMessage = res.statusText
      }
      return { data: null, error: errorMessage, status: res.status }
    }

    // 204 No Content
    if (res.status === 204) {
      return { data: null, error: null, status: 204 }
    }

    const data = (await res.json()) as T
    return { data, error: null, status: res.status }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Network request failed'
    return { data: null, error: message, status: 0 }
  }
}

// ---- Auth ------------------------------------------------------------------

export async function login(
  email: string,
  password: string,
): Promise<ApiResponse<{ token: string; user: User }>> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function loginWithPin(
  pin: string,
  storeId: string,
): Promise<ApiResponse<{ token: string; user: User }>> {
  return request('/api/auth/pin', {
    method: 'POST',
    body: JSON.stringify({ pin, store_id: storeId }),
  })
}

export async function getMe(): Promise<ApiResponse<User>> {
  return request('/api/auth/me')
}

// ---- Store -----------------------------------------------------------------

export async function getStore(id: string): Promise<ApiResponse<Store>> {
  return request(`/api/stores/${id}`)
}

export async function updateStore(
  id: string,
  data: Partial<Store>,
): Promise<ApiResponse<Store>> {
  return request(`/api/stores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ---- Products --------------------------------------------------------------

export async function getProducts(
  storeId: string,
  params?: {
    page?: number
    per_page?: number
    category?: string
    search?: string
    active_only?: boolean
  },
): Promise<ApiResponse<PaginatedResponse<Product>>> {
  const qs = new URLSearchParams()
  qs.set('store_id', storeId)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.per_page) qs.set('per_page', String(params.per_page))
  if (params?.category) qs.set('category', params.category)
  if (params?.search) qs.set('search', params.search)
  if (params?.active_only !== undefined)
    qs.set('active_only', String(params.active_only))
  return request(`/api/products?${qs.toString()}`)
}

export async function getProduct(id: string): Promise<ApiResponse<Product>> {
  return request(`/api/products/${id}`)
}

export async function createProduct(
  data: Omit<Product, 'created_at' | 'updated_at'>,
): Promise<ApiResponse<Product>> {
  return request('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProduct(
  id: string,
  data: Partial<Product>,
): Promise<ApiResponse<Product>> {
  return request(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  return request(`/api/products/${id}`, { method: 'DELETE' })
}

export async function getProductByBarcode(
  storeId: string,
  barcode: string,
): Promise<ApiResponse<Product>> {
  return request(
    `/api/products/barcode/${encodeURIComponent(barcode)}?store_id=${storeId}`,
  )
}

// ---- Orders ----------------------------------------------------------------

export async function getOrders(
  storeId: string,
  params?: {
    page?: number
    per_page?: number
    status?: string
    from?: string
    to?: string
    user_id?: string
  },
): Promise<ApiResponse<PaginatedResponse<Order>>> {
  const qs = new URLSearchParams()
  qs.set('store_id', storeId)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.per_page) qs.set('per_page', String(params.per_page))
  if (params?.status) qs.set('status', params.status)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  if (params?.user_id) qs.set('user_id', params.user_id)
  return request(`/api/orders?${qs.toString()}`)
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  return request(`/api/orders/${id}`)
}

export async function createOrder(
  data: Omit<Order, 'created_at' | 'updated_at'>,
): Promise<ApiResponse<Order>> {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateOrder(
  id: string,
  data: Partial<Order>,
): Promise<ApiResponse<Order>> {
  return request(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function refundOrder(id: string): Promise<ApiResponse<Order>> {
  return request(`/api/orders/${id}/refund`, { method: 'POST' })
}

// ---- Bulk sync (for offline orders) ----------------------------------------

export async function syncOrders(
  orders: Order[],
): Promise<ApiResponse<{ synced: number; failed: string[] }>> {
  return request('/api/orders/sync', {
    method: 'POST',
    body: JSON.stringify({ orders }),
  })
}

// ---- Users / Employees -----------------------------------------------------

export async function getUsers(
  storeId: string,
): Promise<ApiResponse<User[]>> {
  return request(`/api/users?store_id=${storeId}`)
}

export async function getUser(id: string): Promise<ApiResponse<User>> {
  return request(`/api/users/${id}`)
}

export async function createUser(
  data: Omit<User, 'created_at' | 'updated_at'>,
): Promise<ApiResponse<User>> {
  return request('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(
  id: string,
  data: Partial<User>,
): Promise<ApiResponse<User>> {
  return request(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return request(`/api/users/${id}`, { method: 'DELETE' })
}

// ---- Stock movements -------------------------------------------------------

export async function getStockMoves(
  storeId: string,
  params?: {
    product_id?: string
    type?: string
    from?: string
    to?: string
    page?: number
    per_page?: number
  },
): Promise<ApiResponse<PaginatedResponse<StockMove>>> {
  const qs = new URLSearchParams()
  qs.set('store_id', storeId)
  if (params?.product_id) qs.set('product_id', params.product_id)
  if (params?.type) qs.set('type', params.type)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.per_page) qs.set('per_page', String(params.per_page))
  return request(`/api/stock-moves?${qs.toString()}`)
}

export async function createStockMove(
  data: Omit<StockMove, 'created_at'>,
): Promise<ApiResponse<StockMove>> {
  return request('/api/stock-moves', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function syncStockMoves(
  moves: StockMove[],
): Promise<ApiResponse<{ synced: number; failed: string[] }>> {
  return request('/api/stock-moves/sync', {
    method: 'POST',
    body: JSON.stringify({ moves }),
  })
}

// ---- Dashboard / Reports ---------------------------------------------------

export async function getDailySummary(
  storeId: string,
  date: string,
): Promise<
  ApiResponse<{
    total_orders: number
    total_revenue: number
    total_cost: number
    gross_profit: number
    payment_breakdown: Record<string, number>
    top_products: Array<{
      product_id: string
      name: string
      qty: number
      revenue: number
    }>
  }>
> {
  return request(
    `/api/reports/daily?store_id=${storeId}&date=${date}`,
  )
}

export async function getSalesReport(
  storeId: string,
  from: string,
  to: string,
): Promise<
  ApiResponse<{
    total_revenue: number
    total_orders: number
    average_order: number
    daily: Array<{ date: string; revenue: number; orders: number }>
  }>
> {
  return request(
    `/api/reports/sales?store_id=${storeId}&from=${from}&to=${to}`,
  )
}

// ---- Health check ----------------------------------------------------------

export async function healthCheck(): Promise<ApiResponse<{ status: string }>> {
  return request('/api/health')
}

// ---- Connectivity test -----------------------------------------------------

/**
 * Quick check if the server is reachable. Returns true/false without throwing.
 */
export async function isServerReachable(): Promise<boolean> {
  try {
    const base = getServerUrl()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${base}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return res.ok
  } catch {
    return false
  }
}
