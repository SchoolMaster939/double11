
import {
  addToCart,
  fetchMe,
  followTarget,
  getBaseUrl,
  getObjects,
  unfollowTarget,
  type ObjectName,
  type Product,
  type Promotion,
  type Seller,
} from './api'
import { getUser } from './session'

const ICONS = {
  buy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16l-1.5 12.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 7Z"/><path d="M8.5 7V5.5a3.5 3.5 0 1 1 7 0V7"/></svg>',
  cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>',
  detail: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
  follow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>',
  followed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>',
} as const


type FollowKey = `${ObjectName}:${string}`

interface CatalogState {
  products: Product[]
  sellers: Seller[]
  active: Product | null
  followed: Set<FollowKey>
  loading: boolean
  /** 搜索关键词（已 trim + 小写），空串表示不筛选 */
  query: string
  message: string | null
}

const state: CatalogState = {
  products: [],
  sellers: [],
  active: null,
  followed: new Set(),
  loading: false,
  query: '',
  message: null,
}

let baseUrl = ''

let transitionToken = 0

let eventsBound = false

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

function finalPrice(product: Product): number {
  if (!product.promotion) return product.original_price
  return product.original_price * product.promotion.discount_rate
}

function isPromotionActive(promotion: Promotion | null): boolean {
  if (!promotion) return false
  const now = Date.now()
  const start = Date.parse(promotion.start_time)
  const end = Date.parse(promotion.end_time)
  if (Number.isNaN(start) || Number.isNaN(end)) return true
  return now >= start && now <= end
}

function formatPrice(value: number): string {
  return `￥${value.toFixed(2)}`
}

function sellerName(product: Product): string {
  if (product.seller?.name) return product.seller.name
  return state.sellers.find((item) => item.id === product.seller_id)?.name ?? '未知商家'
}

function placeholderMarkup(product: Product): string {
  const initial = (product.name || product.product_type || '?').trim().charAt(0)
  return `<span class="product-card__placeholder">${escapeHtml(initial)}</span>`
}

function followKey(type: ObjectName, id: string): FollowKey {
  return `${type}:${id}`
}

function isFollowed(type: ObjectName, id: string): boolean {
  return state.followed.has(followKey(type, id))
}

function matchesQuery(product: Product): boolean {
  if (!state.query) return true

  const haystack = [
    product.name,
    product.product_type,
    sellerName(product),
    ...Object.entries(product.detail).flatMap(([key, value]) => [key, value]),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(state.query)
}

function visibleProducts(): Product[] {
  return state.query ? state.products.filter(matchesQuery) : state.products
}

function renderFollowButton(type: ObjectName, id: string, label: string): string {
  const followed = isFollowed(type, id)
  return `
    <button class="follow-btn${followed ? ' is-followed' : ''}" type="button"
            data-action="follow" data-type="${type}" data-id="${escapeHtml(id)}">
      ${followed ? ICONS.followed : ICONS.follow}
      <span>${followed ? '已关注' : label}</span>
    </button>
  `
}

function renderCard(product: Product, index: number): string {
  const image = product.images[0]
  const discounted = isPromotionActive(product.promotion)
  const price = finalPrice(product)
  const params = Object.entries(product.detail).filter(([key, value]) => key && value)
  const sellerId = product.seller?.id || product.seller_id
  const promotion = product.promotion

  return `
    <article class="product-card" data-id="${escapeHtml(product.id)}" style="--card-index:${index}">
      <div class="product-card__media">
        ${
          image
            ? `<img class="product-card__img" src="${escapeHtml(imageSrc(image.url))}" alt="${escapeHtml(product.name)}" loading="lazy" />`
            : placeholderMarkup(product)
        }
        ${
          discounted && promotion
            ? `<span class="product-card__badge">${Math.round(promotion.discount_rate * 100)}% 促销</span>`
            : ''
        }
      </div>

      <!-- 收起态内容 -->
      <div class="product-card__body product-card__body--compact">
        <p class="product-card__type">${escapeHtml(product.product_type)}</p>
        <h3>${escapeHtml(product.name || '未命名商品')}</h3>
        <p class="product-card__seller">${escapeHtml(sellerName(product))}</p>

        <div class="product-card__price">
          <strong>${formatPrice(price)}</strong>
          ${
            discounted
              ? `<s>${formatPrice(product.original_price)}</s>
                 <span class="product-card__discount">省 ${formatPrice(product.original_price - price)}</span>`
              : ''
          }
        </div>

        <div class="product-card__actions">
          <button class="icon-btn icon-btn--primary" type="button"
                  data-action="buy" data-id="${escapeHtml(product.id)}" aria-label="购买">
            ${ICONS.buy}<span>购买</span>
          </button>
          <button class="icon-btn" type="button"
                  data-action="cart" data-id="${escapeHtml(product.id)}" aria-label="加入购物车">
            ${ICONS.cart}<span>购物车</span>
          </button>
          <button class="icon-btn" type="button"
                  data-action="detail" data-id="${escapeHtml(product.id)}" aria-label="查看详情">
            ${ICONS.detail}<span>详情</span>
          </button>
        </div>
      </div>

      <!-- 展开态内容：左图右参数 -->
      <div class="product-card__detail">
        <button class="collapse-btn" type="button" data-action="close-detail" aria-label="收起详情">
          ${ICONS.collapse}<span>收起</span>
        </button>

        <div class="detail-right">
          <header class="detail-head">
            <p class="product-card__type">${escapeHtml(product.product_type)}</p>
            <h2>${escapeHtml(product.name || '未命名商品')}</h2>
            <p class="product-card__seller">${escapeHtml(sellerName(product))}</p>
          </header>

          <div class="detail-price">
            <strong>${formatPrice(price)}</strong>
            ${discounted ? `<s>${formatPrice(product.original_price)}</s>` : ''}
            ${
              promotion
                ? `<span class="detail-promo">
                     ${escapeHtml(promotion.name)} · ${Math.round(promotion.discount_rate * 100)}% ·
                     ${escapeHtml(promotion.start_time.slice(0, 10))} ~ ${escapeHtml(promotion.end_time.slice(0, 10))}
                   </span>`
                : ''
            }
          </div>

          <dl class="detail-params">
            ${
              params.length === 0
                ? '<dt>参数</dt><dd>暂无</dd>'
                : params.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('')
            }
          </dl>

          <div class="detail-follows">
            ${renderFollowButton('product', product.id, '关注商品')}
            ${
              sellerId
                ? renderFollowButton('seller', sellerId, '关注店铺')
                : '<button class="follow-btn" type="button" disabled><span>暂无店铺</span></button>'
            }
            ${
              promotion
                ? renderFollowButton('promotion', promotion.id, '关注促销')
                : '<button class="follow-btn" type="button" disabled><span>暂无促销</span></button>'
            }
          </div>

          <div class="detail-actions">
            <button class="icon-btn icon-btn--primary" type="button" data-action="buy" data-id="${escapeHtml(product.id)}">
              ${ICONS.buy}<span>购买</span>
            </button>
            <button class="icon-btn" type="button" data-action="cart" data-id="${escapeHtml(product.id)}">
              ${ICONS.cart}<span>加入购物车</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  `
}

function renderSkeleton(): string {
  return `<div class="product-card product-card--skeleton" aria-hidden="true">
    <div class="product-card__media"></div>
    <div class="product-card__body">
      <span class="skeleton-line"></span>
      <span class="skeleton-line skeleton-line--short"></span>
      <span class="skeleton-line skeleton-line--price"></span>
    </div>
  </div>`
}

function settleCards(): void {
  document.querySelectorAll<HTMLElement>('.product-card').forEach((card) => {
    card.addEventListener('animationend', () => card.classList.add('is-settled'), { once: true })
  })
}

function renderGrid(): string {
  if (state.loading) return renderSkeleton().repeat(6)

  const items = visibleProducts()
  return items.map((product, index) => renderCard(product, index)).join('')
}

function renderEmptySearch(): string {
  if (!state.query || state.loading) return ''

  const count = visibleProducts().length
  if (count > 0) return ''

  return `
    <p class="empty catalog-empty">
      没有找到匹配「${escapeHtml(state.query)}」的商品
    </p>
  `
}

function render(): void {
  const root = document.querySelector<HTMLElement>('[data-page="home"]')
  if (!root) return

  const count = visibleProducts().length
  const total = state.products.length
  const subtitle = state.loading
    ? '正在加载商品…'
    : state.query
      ? `搜索「${escapeHtml(state.query)}」，找到 ${count} 件`
      : `共 ${total} 件商品`

  root.innerHTML = `
    <header class="catalog-head">
      <div>
        <h1>双十一寻宝</h1>
        <p>${subtitle}</p>
      </div>
      ${state.message ? `<p class="form-message form-message--ok">${escapeHtml(state.message)}</p>` : ''}
    </header>

    ${!state.loading && total === 0 ? '<p class="empty">还没有商品，去个人中心注册商家后添加吧</p>' : ''}
    ${renderEmptySearch()}
    <div class="product-grid" id="productGrid">${renderGrid()}</div>
  `

  settleCards()
}


interface Box {
  width: number
  height: number
}

function boxOf(element: Element): Box {
  const rect = element.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

function expandCard(card: HTMLElement): void {
  const grid = document.getElementById('productGrid')
  if (!grid) return

  const from = boxOf(card)

  grid.classList.add('is-expanded-mode')
  card.classList.add('is-expanded', 'is-transitioning')
  const to = boxOf(card)

  if (from.width <= 0 || to.width <= 0) {
    card.classList.remove('is-transitioning')
    return
  }

  const animation = card.animate(
    [
      { width: `${from.width}px`, height: `${from.height}px` },
      { width: `${to.width}px`, height: `${to.height}px` },
    ],
    { duration: 520, easing: 'cubic-bezier(.22, .61, .36, 1)', fill: 'both' },
  )

  animation.onfinish = () => {
    animation.cancel()
    card.classList.remove('is-transitioning')
  }
}

function collapseCard(card: HTMLElement): void {
  const grid = document.getElementById('productGrid')
  if (!grid) return

  const from = boxOf(card)
  card.classList.remove('is-expanded')
  card.classList.add('is-transitioning')
  grid.classList.remove('is-expanded-mode')

  const to = boxOf(card)

  if (from.width <= 0 || to.width <= 0) {
    card.classList.remove('is-transitioning')
    return
  }

  const animation = card.animate(
    [
      { width: `${from.width}px`, height: `${from.height}px` },
      { width: `${to.width}px`, height: `${to.height}px` },
    ],
    { duration: 420, easing: 'cubic-bezier(.22, .61, .36, 1)', fill: 'both' },
  )

  animation.onfinish = () => {
    animation.cancel()
    card.classList.remove('is-transitioning')
    if (!document.querySelector('.product-card.is-expanded')) {
      state.active = null
    }
  }
}

function openDetail(product: Product): void {
  if (state.active?.id === product.id) return
  if (document.querySelector('.product-card.is-expanded')) return

  const card = document.querySelector<HTMLElement>(`.product-card[data-id="${product.id}"]`)
  if (!card) return

  state.active = product
  expandCard(card)
}

function closeDetail(): void {
  const card = document.querySelector<HTMLElement>('.product-card.is-expanded')
  state.active = null

  if (!card) {
    document.getElementById('productGrid')?.classList.remove('is-expanded-mode')
    return
  }
  collapseCard(card)
}

async function loadCatalog(): Promise<void> {
  state.loading = true
  render()

  try {
    const [products, sellers] = await Promise.all([getObjects('product'), getObjects('seller')])
    state.products = products
    state.sellers = sellers
    await loadFollowed()
  } catch (error) {
    state.message = error instanceof Error ? error.message : '商品加载失败'
  } finally {
    state.loading = false
    render()
  }
}

async function loadFollowed(): Promise<void> {
  state.followed.clear()
  if (!getUser()) return

  try {
    const me = await fetchMe()
    for (const item of me.follows) {
      state.followed.add(followKey(item.target_type, item.target_id))
    }
  } catch {
  }
}

function flash(text: string): void {
  state.message = text
  render()
  window.setTimeout(() => {
    state.message = null
    render()
  }, 1800)
}

async function handleAddToCart(product: Product): Promise<void> {
  if (!getUser()) {
    flash('请先登录后再加入购物车')
    return
  }

  try {
    await addToCart(product.id)
    flash(`已加入购物车：${product.name || '商品'}`)
  } catch (error) {
    flash(error instanceof Error ? error.message : '加入购物车失败')
  }
}

function handleBuy(product: Product): void {
  const price = finalPrice(product)
  window.alert(
    `订单已确认\n\n${product.name || '商品'}\n单价：${formatPrice(price)}\n数量：1\n合计：${formatPrice(price)}`,
  )
}

async function handleFollow(type: ObjectName, id: string): Promise<void> {
  if (!getUser()) {
    flash('请先登录后再关注')
    return
  }

  const key = followKey(type, id)
  const followed = state.followed.has(key)

  try {
    if (followed) await unfollowTarget(type, id)
    else await followTarget(type, id)

    if (followed) state.followed.delete(key)
    else state.followed.add(key)

    const card = document.querySelector<HTMLElement>('.product-card.is-expanded')
    card?.querySelectorAll<HTMLElement>('.follow-btn').forEach((button) => {
      if (button.dataset.type !== type || button.dataset.id !== id) return
      const nowFollowed = state.followed.has(followKey(type, id))
      button.classList.toggle('is-followed', nowFollowed)
      button.innerHTML = `${nowFollowed ? ICONS.followed : ICONS.follow}<span>${
        nowFollowed ? '已关注' : followLabel(type)
      }</span>`
    })
  } catch (error) {
    flash(error instanceof Error ? error.message : '关注失败')
  }
}

function followLabel(type: ObjectName): string {
  if (type === 'seller') return '关注店铺'
  if (type === 'promotion') return '关注促销'
  return '关注商品'
}

function onHomeClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const button = target.closest<HTMLElement>('[data-action]')
  if (!button) return

  switch (button.dataset.action) {
    case 'detail': {
      const product = state.products.find((item) => item.id === button.dataset.id)
      if (!product || state.active) return
      openDetail(product)
      break
    }
    case 'close-detail':
      closeDetail()
      break
    case 'follow':
      void handleFollow(button.dataset.type as ObjectName, button.dataset.id ?? '')
      break
    case 'cart': {
      const product = state.products.find((item) => item.id === button.dataset.id)
      if (product) void handleAddToCart(product)
      break
    }
    case 'buy': {
      const product = state.products.find((item) => item.id === button.dataset.id)
      if (product) handleBuy(product)
      break
    }
  }
}

function onEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !state.active) return
  closeDetail()
}

function bindEvents(): void {
  if (eventsBound) return
  eventsBound = true

  const root = document.querySelector<HTMLElement>('[data-page="home"]')
  if (!root) {
    eventsBound = false
    return
  }

  root.addEventListener('click', onHomeClick)
  document.addEventListener('keydown', onEscape)
}

export async function refreshCatalog(): Promise<void> {
  if (state.active) {
    transitionToken += 1
    state.active = null
  }
  await loadCatalog()
}

export function setSearchQuery(raw: string): void {
  const next = raw.trim().toLowerCase()
  if (next === state.query) return

  const hadActive = Boolean(document.querySelector('.product-card.is-expanded'))
  state.query = next

  if (hadActive) {
    transitionToken += 1
    state.active = null
  }

  render()
}

export function setupCatalog(): void {
  void getBaseUrl().then((url) => {
    baseUrl = url
    render()
  })
  bindEvents()
  void loadCatalog()
}
