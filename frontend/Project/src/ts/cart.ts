import {
  fetchCart,
  getBaseUrl,
  getObjects,
  removeCartItem,
  updateCartItem,
  type CartItem,
  type Product,
} from './api'
import { getUser } from './session'

interface CartState {
  items: CartItem[]
  products: Product[]
  loading: boolean
  message: string | null
}

const state: CartState = {
  items: [],
  products: [],
  loading: false,
  message: null,
}

let baseUrl = ''

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[char]
  })
}

function imageSrc(url: string): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return `${baseUrl}${url}`
}

function productOf(item: CartItem): Product | undefined {
  return state.products.find((product) => product.id === item.product_id)
}

function unitPrice(product: Product): number {
  if (!product.promotion) return product.original_price
  return product.original_price * product.promotion.discount_rate
}

function formatPrice(value: number): string {
  return `￥${value.toFixed(2)}`
}

function totalPrice(): number {
  return state.items.reduce((sum, item) => {
    const product = productOf(item)
    return product ? sum + unitPrice(product) * item.quantity : sum
  }, 0)
}

function renderRow(item: CartItem, index: number): string {
  const product = productOf(item)
  const name = product?.name || '商品已下架'
  const image = product?.images[0]
  const price = product ? unitPrice(product) : 0

  return `
    <article class="cart-row" style="--row-index:${index}">
      <div class="cart-row__media">
        ${
          image
            ? `<img src="${escapeHtml(imageSrc(image.url))}" alt="${escapeHtml(name)}" />`
            : `<span class="product-card__placeholder">${escapeHtml(name.charAt(0))}</span>`
        }
      </div>
      <div>
        <h3>${escapeHtml(name)}</h3>
        <small>${product ? escapeHtml(product.product_type) : '未知类别'} · 单价 ${formatPrice(price)}</small>
      </div>
      <div class="cart-qty">
        <button type="button" data-action="decrease" data-id="${escapeHtml(item.id)}" aria-label="减少数量">−</button>
        <span>${item.quantity}</span>
        <button type="button" data-action="increase" data-id="${escapeHtml(item.id)}" aria-label="增加数量">+</button>
        <button type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="移除">×</button>
      </div>
      <div class="cart-row__price">${formatPrice(price * item.quantity)}</div>
    </article>
  `
}

function render(): void {
  const root = document.querySelector<HTMLElement>('[data-page="cart"]')
  if (!root) return

  if (!getUser()) {
    root.innerHTML = `
      <div class="cart-page">
        <h1>购物车</h1>
        <p class="cart-empty">登录后才能查看购物车</p>
      </div>`
    return
  }

  root.innerHTML = `
    <div class="cart-page">
      <div class="catalog-head">
        <div>
          <h1>购物车</h1>
          <p>${state.loading ? '正在加载…' : `共 ${state.items.length} 件商品`}</p>
        </div>
        ${state.message ? `<p class="form-message form-message--ok">${escapeHtml(state.message)}</p>` : ''}
      </div>

      ${
        state.items.length === 0
          ? '<p class="cart-empty">购物车还是空的</p>'
          : `<div class="cart-list">${state.items.map(renderRow).join('')}</div>
             <div class="cart-summary">
               <span>合计</span>
               <strong>${formatPrice(totalPrice())}</strong>
             </div>
             <div class="profile-actions" style="justify-content:flex-end;margin-top:0.9rem">
               <button class="btn btn--primary" type="button" data-action="checkout">结算</button>
             </div>`
      }
    </div>
  `
}

async function loadCart(): Promise<void> {
  state.loading = true
  render()

  try {
    const [items, products] = await Promise.all([fetchCart(), getObjects('product')])
    state.items = items
    state.products = products
  } catch (error) {
    state.message = error instanceof Error ? error.message : '购物车加载失败'
  } finally {
    state.loading = false
    render()
  }
}

function flash(text: string): void {
  state.message = text
  render()
  window.setTimeout(() => {
    state.message = null
    render()
  }, 1600)
}


async function changeQuantity(item: CartItem, delta: number): Promise<void> {
  const next = item.quantity + delta

  try {
    if (next <= 0) await removeCartItem(item.id)
    else await updateCartItem(item.id, next)

    if (next <= 0) state.items = state.items.filter((row) => row.id !== item.id)
    else state.items = state.items.map((row) => (row.id === item.id ? { ...row, quantity: next } : row))
    render()
  } catch (error) {
    flash(error instanceof Error ? error.message : '更新数量失败')
  }
}

function checkout(): void {
  window.alert(`订单已提交\n\n合计：${formatPrice(totalPrice())}\n共 ${state.items.length} 种商品`)
}

function bindEvents(): void {
  const root = document.querySelector<HTMLElement>('[data-page="cart"]')
  if (!root) return

  root.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLButtonElement>('[data-action]')
    if (!button) return

    const item = state.items.find((row) => row.id === button.dataset.id)

    switch (button.dataset.action) {
      case 'increase':
        if (item) void changeQuantity(item, 1)
        break
      case 'decrease':
        if (item) void changeQuantity(item, -1)
        break
      case 'remove':
        if (item) void changeQuantity(item, -item.quantity)
        break
      case 'checkout':
        checkout()
        break
    }
  })
}

export async function refreshCart(): Promise<void> {
  if (!getUser()) {
    render()
    return
  }
  await loadCart()
}

export function setupCart(): void {
  void getBaseUrl().then((url) => {
    baseUrl = url
    render()
  })
  bindEvents()
}
