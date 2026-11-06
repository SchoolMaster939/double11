/*
 通用增删改查：/{object}、/{object}/{id}（object = seller / promotion / product）
 认证：/auth/register、/auth/login、/auth/me、/auth/logout
 关注：/follows/{type}/{id}
*/

export interface Seller {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  name: string
  start_time: string
  end_time: string
  discount_rate: number
  seller_id: string
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  url: string
  filename: string
}

export interface Product {
  id: string
  name: string
  product_type: string
  detail: Record<string, string>
  original_price: number
  images: ProductImage[]
  promotion: Promotion | null
  seller: Seller | null
  seller_id: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  account: string
  name: string
  avatar: string | null
  created_at: string
}

export interface Follow {
  id: string
  user_id: string
  target_type: ObjectName
  target_id: string
  created_at: string
}

export interface AuthResult {
  token: string
  user: User
}

export interface MeResult extends User {
  follows: Follow[]
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
}

interface RequestOptions extends RequestInit {
  rawBody?: boolean
}

export type ObjectName = 'seller' | 'promotion' | 'product'

export type SellerInput = Partial<Pick<Seller, 'name' | 'owner_id'>>
export type PromotionInput = Partial<
  Pick<Promotion, 'name' | 'start_time' | 'end_time' | 'discount_rate' | 'seller_id'>
>
export type ProductInput = Partial<
  Pick<
    Product,
    'name' | 'product_type' | 'detail' | 'original_price' | 'images' | 'seller' | 'seller_id' | 'promotion'
  >
>

interface ObjectTypeMap {
  seller: Seller
  promotion: Promotion
  product: Product
}

interface ObjectInputMap {
  seller: SellerInput
  promotion: PromotionInput
  product: ProductInput
}

export const TOKEN_KEY = 'double11.token'

const BASE_URL_FALLBACK = 'http://127.0.0.1:8000'

function resolveBaseUrl(): Promise<string> {
  if (window.pywebview?.api) {
    return window.pywebview.api.get_base_url()
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('pywebviewready', onReady)
      resolve(BASE_URL_FALLBACK)
    }, 1000)

    const onReady = () => {
      window.clearTimeout(timer)
      resolve(window.pywebview.api.get_base_url())
    }

    window.addEventListener('pywebviewready', onReady, { once: true })
  })
}

let baseUrlPromise: Promise<string> | null = null

export function getBaseUrl(): Promise<string> {
  baseUrlPromise ??= resolveBaseUrl()
  return baseUrlPromise
}

export async function resolveImageUrl(url: string): Promise<string> {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  const baseUrl = await getBaseUrl()
  return `${baseUrl}${url}`
}

export function readToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function writeToken(token: string | null): void {
  if (token) window.localStorage.setItem(TOKEN_KEY, token)
  else window.localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const baseUrl = await getBaseUrl()
  const token = readToken()

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.rawBody ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    let detail = `请求失败(${res.status})`
    try {
      const body = (await res.json()) as { detail?: unknown }
      if (body?.detail) {
        detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
      }
    } catch {
    }
    throw new Error(detail)
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export interface UploadedImage {
  id: string
  url: string
  filename: string
}

export function uploadImage(file: File): Promise<UploadedImage> {
  const form = new FormData()
  form.append('file', file)
  return request<UploadedImage>('/upload/image', {
    method: 'POST',
    body: form,
    rawBody: true,
  })
}

export function registerAccount(account: string, password: string, name?: string): Promise<AuthResult> {
  return request<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ account, password, name }),
  })
}

export function loginAccount(account: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ account, password }),
  })
}

export function fetchMe(): Promise<MeResult> {
  return request<MeResult>('/auth/me')
}

export function logoutAccount(): Promise<{ detail: string }> {
  return request<{ detail: string }>('/auth/logout', { method: 'POST' })
}

export function followTarget(type: ObjectName, id: string): Promise<Follow> {
  return request<Follow>(`/follows/${type}/${encodeURIComponent(id)}`, { method: 'POST' })
}

export function unfollowTarget(type: ObjectName, id: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/follows/${type}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchCart(): Promise<CartItem[]> {
  return request<CartItem[]>('/cart')
}

export function addToCart(productId: string, quantity = 1): Promise<CartItem> {
  return request<CartItem>('/cart', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  })
}

export function updateCartItem(itemId: string, quantity: number): Promise<CartItem | { detail: string }> {
  return request<CartItem | { detail: string }>(`/cart/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  })
}

export function removeCartItem(itemId: string): Promise<{ detail: string }> {
  return request<{ detail: string }>(`/cart/${encodeURIComponent(itemId)}`, { method: 'DELETE' })
}

export function getObjects<K extends ObjectName>(object: K): Promise<ObjectTypeMap[K][]> {
  return request<ObjectTypeMap[K][]>(`/${object}`)
}

export function getObject<K extends ObjectName>(object: K, id: string): Promise<ObjectTypeMap[K]> {
  return request<ObjectTypeMap[K]>(`/${object}/${encodeURIComponent(id)}`)
}

export function createObject<K extends ObjectName>(
  object: K,
  data: ObjectInputMap[K],
): Promise<ObjectTypeMap[K]> {
  return request<ObjectTypeMap[K]>(`/${object}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateObject<K extends ObjectName>(
  object: K,
  id: string,
  data: Partial<ObjectInputMap[K]>,
): Promise<ObjectTypeMap[K]> {
  return request<ObjectTypeMap[K]>(`/${object}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteObject<K extends ObjectName>(
  object: K,
  id: string,
): Promise<{ detail: string; id: string }> {
  return request<{ detail: string; id: string }>(`/${object}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
