import {
  createObject,
  deleteObject,
  fetchMe,
  getBaseUrl,
  getObjects,
  updateObject,
  type Follow,
  type ObjectName,
  type Product,
  type ProductImage,
  type Promotion,
  type Seller,
  unfollowTarget,
  uploadImage,
} from './api'
import { getUser, login, logout, register, subscribe } from './session'


interface ParamPair {
  key: string
  value: string
}

interface ProfileState {
  authMode: 'login' | 'register'
  draft: { account: string; password: string; name: string }
  busy: boolean
  message: { text: string; kind: 'error' | 'ok' } | null

  follows: Follow[]
  products: Product[]
  promotions: Promotion[]
  sellers: Seller[]

  mySellers: Seller[]
  openForm: Record<string, 'product' | 'promotion' | undefined>
  sellerFormOpen: boolean

  editing: Record<string, { kind: 'product' | 'promotion'; id: string } | undefined>
  promotionDraft: Record<
    string,
    { name: string; startTime: string; endTime: string; discountRate: string }
  >

  productDraft: Record<
    string,
    {
      name: string
      productType: string
      originalPrice: string
      promotionId: string
      params: ParamPair[]
      images: ProductImage[]
      uploading: boolean
    }
  >
}

function newProductDraft() {
  return {
    name: '',
    productType: '',
    originalPrice: '',
    promotionId: '',
    params: [{ key: '', value: '' }],
    images: [] as ProductImage[],
    uploading: false,
  }
}

const state: ProfileState = {
  authMode: 'login',
  draft: { account: '', password: '', name: '' },
  busy: false,
  message: null,
  follows: [],
  products: [],
  promotions: [],
  sellers: [],
  mySellers: [],
  openForm: {},
  sellerFormOpen: false,
  productDraft: {},
  editing: {},
  promotionDraft: {},
}

const TYPE_LABEL: Record<ObjectName, string> = {
  product: '商品',
  promotion: '促销',
  seller: '商家',
}

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

let cachedBaseUrl = ''
void getBaseUrl().then((url) => {
  cachedBaseUrl = url
})

function imageSrc(url: string): string {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return `${cachedBaseUrl}${url}`
}

function avatarMarkup(userName: string, avatar: string | null): string {
  if (avatar) {
    return `<img class="profile-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(userName)}" />`
  }
  const initial = userName.trim().charAt(0).toUpperCase() || '?'
  return `<span class="profile-avatar profile-avatar--text">${escapeHtml(initial)}</span>`
}

function formatDiscount(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

function formatDate(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso
}

function formatRange(start: string, end: string): string {
  return `${formatDate(start)} ~ ${formatDate(end)}`
}

function formatParams(detail: Record<string, string>): string {
  const entries = Object.entries(detail).filter(([key, value]) => key.trim() && value.trim())
  if (entries.length === 0) return '未填写参数'
  return entries.map(([key, value]) => `${key} ${value}`).join(' · ')
}

function productDraft(sellerId: string) {
  state.productDraft[sellerId] ??= newProductDraft()
  return state.productDraft[sellerId]
}

interface FollowedItem {
  id: string
  label: string
  meta: string
  thumbnail: string
}

function followedItems(type: ObjectName): FollowedItem[] {
  const ids = state.follows.filter((item) => item.target_type === type).map((item) => item.target_id)

  if (type === 'product') {
    return ids
      .map((id) => state.products.find((item) => item.id === id))
      .filter((item): item is Product => Boolean(item))
      .map((item) => ({
        id: item.id,
        label: item.name || formatParams(item.detail),
        meta: `￥${item.original_price.toFixed(2)} · ${item.product_type} · ${formatParams(item.detail)}`,
        thumbnail: item.images[0] ? imageSrc(item.images[0].url) : '',
      }))
  }

  if (type === 'promotion') {
    return ids
      .map((id) => state.promotions.find((item) => item.id === id))
      .filter((item): item is Promotion => Boolean(item))
      .map((item) => ({
        id: item.id,
        label: item.name,
        meta: `${formatDiscount(item.discount_rate)} · ${formatRange(item.start_time, item.end_time)}`,
        thumbnail: '',
      }))
  }

  return ids
    .map((id) => state.sellers.find((item) => item.id === id))
    .filter((item): item is Seller => Boolean(item))
    .map((item) => ({ id: item.id, label: item.name, meta: '商家', thumbnail: '' }))
}

function renderAuthPanel(): string {
  const { authMode, draft, busy, message } = state
  const isLogin = authMode === 'login'

  return `
    <form class="auth-card" data-action="auth" novalidate>
      <div class="profile-headline">
        <h1>${isLogin ? '登录' : '注册'}</h1>
        <p>登录后可以查看关注的商品、促销和商家，也可以注册自己的商家。</p>
      </div>

      <label class="field">
        <span>账号</span>
        <input name="account" type="text" value="${escapeHtml(draft.account)}" autocomplete="username" />
      </label>

      <label class="field">
        <span>密码</span>
        <input name="password" type="password" value="${escapeHtml(draft.password)}"
               autocomplete="${isLogin ? 'current-password' : 'new-password'}" />
      </label>

      ${
        isLogin
          ? ''
          : `<label class="field">
               <span>昵称<span class="field-hint">不填则用账号</span></span>
               <input name="name" type="text" value="${escapeHtml(draft.name)}" autocomplete="nickname" />
             </label>`
      }

      ${message ? `<p class="form-message form-message--${message.kind}">${escapeHtml(message.text)}</p>` : ''}

      <div class="profile-actions">
        <button class="btn btn--primary" type="submit" ${busy ? 'disabled' : ''}>
          ${busy ? '请稍候…' : isLogin ? '登录' : '注册'}
        </button>
        <button class="btn btn--ghost" type="button" data-action="switch-auth" ${busy ? 'disabled' : ''}>
          ${isLogin ? '还没有账号？去注册' : '已经有账号？去登录'}
        </button>
      </div>
    </form>
  `
}

function renderFollowCards(): string {
  return `
    <div class="follow-grid">
      ${(['product', 'promotion', 'seller'] as const)
        .map((type) => {
          const items = followedItems(type)
          return `
            <section class="follow-card">
              <header>
                <h2>${TYPE_LABEL[type]}</h2>
                <span class="count">${items.length}</span>
              </header>
              ${
                items.length === 0
                  ? '<p class="empty">还没有关注</p>'
                  : `<ul>${items
                      .map(
                        (item) => `
                      <li>
                        ${
                          item.thumbnail
                            ? `<img class="follow-thumb" src="${escapeHtml(item.thumbnail)}" alt="" />`
                            : ''
                        }
                        <div>
                          <strong>${escapeHtml(item.label)}</strong>
                          <small>${escapeHtml(item.meta)}</small>
                        </div>
                        <button class="link" type="button"
                                data-action="unfollow" data-type="${type}" data-id="${escapeHtml(item.id)}">
                          取消关注
                        </button>
                      </li>`,
                      )
                      .join('')}</ul>`
              }
            </section>
          `
        })
        .join('')}
    </div>
  `
}

function renderUserCard(): string {
  const user = getUser()
  if (!user) return ''

  return `
    <section class="user-card">
      ${avatarMarkup(user.name, user.avatar)}
      <div class="user-card__meta">
        <h1>${escapeHtml(user.name)}</h1>
        <p>账号 ${escapeHtml(user.account)}</p>
      </div>
      <button class="btn btn--ghost" type="button" data-action="logout">退出登录</button>
    </section>
  `
}

function renderProductForm(seller: Seller): string {
  const draft = productDraft(seller.id)
  const editing = state.editing[seller.id]?.kind === 'product'

  return `
    <form class="inline-form inline-form--product"
          data-action="${editing ? 'update-product' : 'create-product'}"
          data-seller="${escapeHtml(seller.id)}">
      <label class="field"><span>商品名称</span>
        <input name="name" type="text" placeholder="例如：xx电脑"
               value="${escapeHtml(draft.name)}" required />
      </label>
      <label class="field"><span>类别</span>
        <input name="product_type" type="text" placeholder="数码 / 零食"
               value="${escapeHtml(draft.productType)}" required />
      </label>
      <label class="field"><span>原价</span>
        <input name="original_price" type="number" min="0" step="0.01"
               value="${escapeHtml(draft.originalPrice)}" required />
      </label>
      <label class="field"><span>促销</span>
        <select name="promotion_id">
          <option value="">不参与促销</option>
          ${state.promotions
            .map(
              (item) =>
                `<option value="${escapeHtml(item.id)}"${
                  item.id === draft.promotionId ? ' selected' : ''
                }>${escapeHtml(item.name)}（${escapeHtml(
                  formatRange(item.start_time, item.end_time),
                )}）</option>`,
            )
            .join('')}
        </select>
      </label>

      <fieldset class="param-block">
        <legend>具体参数</legend>
        <div class="param-rows">
          ${draft.params
            .map(
              (pair, index) => `
            <div class="param-row">
              <input name="param-key" type="text" placeholder="参数名" value="${escapeHtml(pair.key)}"
                     data-param-index="${index}" data-param-side="key" />
              <input name="param-value" type="text" placeholder="参数值" value="${escapeHtml(pair.value)}"
                     data-param-index="${index}" data-param-side="value" />
            </div>`,
            )
            .join('')}
        </div>
        <button class="link" type="button" data-action="add-param" data-seller="${escapeHtml(seller.id)}">
          + 增加一行参数
        </button>
      </fieldset>

      <fieldset class="image-block">
        <legend>商品图片</legend>
        <input type="file" accept="image/*" multiple data-action="pick-images"
               data-seller="${escapeHtml(seller.id)}" ${draft.uploading ? 'disabled' : ''} />
        <div class="image-preview">
          ${draft.images
            .map(
              (image) => `
            <span class="image-preview__item">
              <img src="${escapeHtml(imageSrc(image.url))}" alt="" />
              <button type="button" class="image-preview__remove"
                      data-action="remove-image" data-seller="${escapeHtml(seller.id)}"
                      data-image="${escapeHtml(image.id)}">×</button>
            </span>`,
            )
            .join('')}
        </div>
      </fieldset>

      <button class="btn btn--primary" type="submit" ${draft.uploading ? 'disabled' : ''}>
        ${draft.uploading ? '图片上传中…' : editing ? '保存修改' : '创建商品'}
      </button>
    </form>
  `
}

function renderPromotionForm(seller: Seller): string {
  const editing = state.editing[seller.id]?.kind === 'promotion'
  const draft = editing
    ? state.promotionDraft[seller.id] ?? {
        name: '',
        startTime: '',
        endTime: '',
        discountRate: '',
      }
    : { name: '', startTime: '', endTime: '', discountRate: '' }

  return `
    <form class="inline-form" data-action="${editing ? 'update-promotion' : 'create-promotion'}"
          data-seller="${escapeHtml(seller.id)}">
      <label class="field"><span>名称</span>
        <input name="name" type="text" value="${escapeHtml(draft.name)}" required />
      </label>
      <label class="field"><span>开始时间</span>
        <input name="start_time" type="datetime-local" value="${escapeHtml(draft.startTime)}" required />
      </label>
      <label class="field"><span>结束时间</span>
        <input name="end_time" type="datetime-local" value="${escapeHtml(draft.endTime)}" required />
      </label>
      <label class="field"><span>折扣（0~1）</span>
        <input name="discount_rate" type="number" min="0" max="1" step="0.01"
               value="${escapeHtml(draft.discountRate)}" required />
      </label>
      <button class="btn btn--primary" type="submit">${editing ? '保存修改' : '创建促销'}</button>
    </form>
  `
}

function sellerInventory(sellerId: string) {
  const products = state.products.filter((item) => item.seller_id === sellerId)
  const linkedPromotionIds = new Set(
    products.map((item) => item.promotion?.id).filter((id): id is string => Boolean(id)),
  )
  const promotions = state.promotions.filter(
    (item) => item.seller_id === sellerId || linkedPromotionIds.has(item.id),
  )

  return { products, promotions }
}

function renderInventoryList(sellerId: string): string {
  const { products, promotions } = sellerInventory(sellerId)

  const productItems = products
    .map(
      (item) => `
      <li>
        <div>
          <strong>${escapeHtml(item.name || formatParams(item.detail))}</strong>
          <small>￥${item.original_price.toFixed(2)} · ${escapeHtml(item.product_type)}</small>
        </div>
        <div>
          <button class="link" type="button" data-action="edit-product" data-id="${escapeHtml(item.id)}">修改</button>
          <button class="link" type="button" data-action="delete-product" data-id="${escapeHtml(item.id)}">删除</button>
        </div>
      </li>`,
    )
    .join('')

  const promotionItems = promotions
    .map(
      (item) => `
      <li>
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${formatDiscount(item.discount_rate)} · ${escapeHtml(
            formatRange(item.start_time, item.end_time),
          )}</small>
        </div>
        <div>
          <button class="link" type="button" data-action="edit-promotion" data-id="${escapeHtml(item.id)}">修改</button>
          <button class="link" type="button" data-action="delete-promotion" data-id="${escapeHtml(item.id)}">删除</button>
        </div>
      </li>`,
    )
    .join('')

  return `
    <div class="inventory">
      <div class="inventory__col">
        <h4>已加入商品 <span class="count">${products.length}</span></h4>
        ${products.length === 0 ? '<p class="empty">暂无商品</p>' : `<ul>${productItems}</ul>`}
      </div>
      <div class="inventory__col">
        <h4>已加入促销 <span class="count">${promotions.length}</span></h4>
        ${
          promotions.length === 0 ? '<p class="empty">暂无促销</p>' : `<ul>${promotionItems}</ul>`
        }
      </div>
    </div>
  `
}

function renderSellerRow(seller: Seller): string {
  const formKind = state.openForm[seller.id]

  return `
    <article class="seller-row">
      <header>
        <div>
          <h3>${escapeHtml(seller.name)}</h3>
          <small>商家 ID：${escapeHtml(seller.id)}</small>
        </div>
        <div class="seller-row__actions">
          <button class="btn btn--ghost" type="button"
                  data-action="toggle-form" data-seller="${escapeHtml(seller.id)}" data-kind="product">
            加入商品
          </button>
          <button class="btn btn--ghost" type="button"
                  data-action="toggle-form" data-seller="${escapeHtml(seller.id)}" data-kind="promotion">
            加入促销
          </button>
        </div>
      </header>

      ${renderInventoryList(seller.id)}

      ${formKind === 'product' ? renderProductForm(seller) : ''}
      ${formKind === 'promotion' ? renderPromotionForm(seller) : ''}
    </article>
  `
}

function renderSellerSection(): string {
  return `
    <section class="seller-section">
      <header class="section-head">
        <h2>我的商家</h2>
        <button class="btn btn--primary" type="button" data-action="toggle-seller-form">
          ${state.sellerFormOpen ? '收起' : '注册商家'}
        </button>
      </header>

      ${
        state.sellerFormOpen
          ? `<form class="inline-form" data-action="create-seller">
               <label class="field"><span>商家名称</span><input name="name" type="text" required /></label>
               <button class="btn btn--primary" type="submit">创建商家</button>
             </form>`
          : ''
      }

      ${
        state.mySellers.length === 0
          ? '<p class="empty">还没有注册商家</p>'
          : state.mySellers.map(renderSellerRow).join('')
      }
    </section>
  `
}

function render(): void {
  const root = document.querySelector<HTMLElement>('[data-page="profile"]')
  if (!root) return

  if (!getUser()) {
    root.innerHTML = renderAuthPanel()
    return
  }

  root.innerHTML = `${renderUserCard()}${renderFollowCards()}${renderSellerSection()}`
}

async function loadProfileData(): Promise<void> {
  const [products, promotions, sellers, me] = await Promise.all([
    getObjects('product'),
    getObjects('promotion'),
    getObjects('seller'),
    fetchMe(),
  ])

  state.products = products
  state.promotions = promotions
  state.sellers = sellers
  state.follows = me.follows
  state.mySellers = sellers.filter((seller) => seller.owner_id === me.id)

  render()
}

function setMessage(text: string, kind: 'error' | 'ok' = 'error'): void {
  state.message = { text, kind }
  render()
}

async function handleAuthSubmit(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form)
  const account = String(data.get('account') ?? '').trim()
  const password = String(data.get('password') ?? '')
  const name = String(data.get('name') ?? '').trim()

  if (!account || !password) {
    setMessage('账号和密码都不能为空')
    return
  }

  state.busy = true
  render()

  try {
    if (state.authMode === 'login') await login(account, password)
    else await register(account, password, name)

    state.busy = false
    state.message = null
    state.draft = { account: '', password: '', name: '' }
    await loadProfileData()
  } catch (error) {
    state.busy = false
    setMessage(error instanceof Error ? error.message : '操作失败')
  }
}

async function handleUnfollow(type: ObjectName, id: string): Promise<void> {
  try {
    await unfollowTarget(type, id)
    state.follows = state.follows.filter(
      (item) => !(item.target_type === type && item.target_id === id),
    )
    render()
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '取消失败')
  }
}

async function handleCreateSeller(form: HTMLFormElement): Promise<void> {
  const user = getUser()
  if (!user) return

  const name = String(new FormData(form).get('name') ?? '').trim()
  if (!name) return

  try {
    await createObject('seller', { name, owner_id: user.id })
    state.sellerFormOpen = false
    await loadProfileData()
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '创建商家失败')
  }
}

/** 打开某个商品 / 促销的编辑表单，并把当前值填进草稿 */
function startEditing(sellerId: string, kind: 'product' | 'promotion', id: string): void {
  const product = kind === 'product' ? state.products.find((item) => item.id === id) : undefined
  const promotion = kind === 'promotion' ? state.promotions.find((item) => item.id === id) : undefined

  if (!product && !promotion) return

  state.editing[sellerId] = { kind, id }
  state.openForm[sellerId] = kind

  if (product) {
    state.productDraft[sellerId] = {
      name: product.name,
      productType: product.product_type,
      originalPrice: String(product.original_price),
      promotionId: product.promotion?.id ?? '',
      params: Object.entries(product.detail).map(([key, value]) => ({ key, value })),
      images: [...product.images],
      uploading: false,
    }
  }

  if (promotion) {
    state.promotionDraft[sellerId] = {
      name: promotion.name,
      // datetime-local 需要 YYYY-MM-DDTHH:mm
      startTime: promotion.start_time.slice(0, 16),
      endTime: promotion.end_time.slice(0, 16),
      discountRate: String(promotion.discount_rate),
    }
  }

  render()
}

/**
 * 更新已有的商品 / 促销。
 * 表单值先同步进草稿，再把完整字段提交给 PUT 接口。
 */
async function handleUpdate(
  type: 'product' | 'promotion',
  id: string,
  form: HTMLFormElement,
  sellerId: string,
): Promise<void> {
  try {
    if (type === 'product') {
      syncProductDraftFromForm(form, sellerId)
      const draft = productDraft(sellerId)
      const params: Record<string, string> = {}

      for (const pair of draft.params) {
        const key = pair.key.trim()
        if (key) params[key] = pair.value.trim()
      }

      await updateObject('product', id, {
        name: draft.name.trim(),
        product_type: draft.productType.trim(),
        original_price: Number(draft.originalPrice || 0),
        detail: params,
        images: draft.images,
        promotion: state.promotions.find((item) => item.id === draft.promotionId) ?? null,
      })
    } else {
      // 促销：把表单值先同步进草稿，再提交
      const data = new FormData(form)
      const draft = state.promotionDraft[sellerId] ?? {
        name: '',
        startTime: '',
        endTime: '',
        discountRate: '',
      }
      draft.name = String(data.get('name') ?? draft.name)
      draft.startTime = String(data.get('start_time') ?? draft.startTime)
      draft.endTime = String(data.get('end_time') ?? draft.endTime)
      draft.discountRate = String(data.get('discount_rate') ?? draft.discountRate)

      await updateObject('promotion', id, {
        name: draft.name.trim(),
        start_time: draft.startTime,
        end_time: draft.endTime,
        discount_rate: Number(draft.discountRate || 0),
      })
    }

    // 收尾：退出编辑态，清掉草稿
    state.editing[sellerId] = undefined
    state.openForm[sellerId] = undefined
    delete state.productDraft[sellerId]
    delete state.promotionDraft[sellerId]
    await loadProfileData()
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '保存失败')
  }
}

function syncProductDraftFromForm(form: HTMLFormElement, sellerId: string): void {
  const draft = productDraft(sellerId)
  const name = form.querySelector<HTMLInputElement>('[name="name"]')
  const type = form.querySelector<HTMLInputElement>('[name="product_type"]')
  const price = form.querySelector<HTMLInputElement>('[name="original_price"]')
  const promotion = form.querySelector<HTMLSelectElement>('[name="promotion_id"]')

  if (name) draft.name = name.value
  if (type) draft.productType = type.value
  if (price) draft.originalPrice = price.value
  if (promotion) draft.promotionId = promotion.value

  form.querySelectorAll<HTMLInputElement>('[data-param-side]').forEach((field) => {
    const index = Number(field.dataset.paramIndex ?? -1)
    const pair = draft.params[index]
    if (!pair) return
    if (field.dataset.paramSide === 'key') pair.key = field.value
    else pair.value = field.value
  })
}

async function handleDelete(type: 'product' | 'promotion', id: string): Promise<void> {
  const label = type === 'product' ? '商品' : '促销'
  if (!window.confirm(`确定删除这个${label}吗？`)) return

  try {
    await deleteObject(type, id)
    state.products = state.products.filter((item) => !(type === 'product' && item.id === id))
    state.promotions = state.promotions.filter((item) => !(type === 'promotion' && item.id === id))
    render()
  } catch (error) {
    setMessage(error instanceof Error ? error.message : `${label}删除失败`)
  }
}

async function handleCreateProduct(form: HTMLFormElement, sellerId: string): Promise<void> {
  const seller = state.mySellers.find((item) => item.id === sellerId)
  if (!seller) return

  const draft = productDraft(sellerId)
  syncProductDraftFromForm(form, sellerId)

  const params: Record<string, string> = {}
  for (const pair of draft.params) {
    const key = pair.key.trim()
    if (key) params[key] = pair.value.trim()
  }

  const promotion = state.promotions.find((item) => item.id === draft.promotionId)

  try {
    await createObject('product', {
      name: draft.name.trim(),
      product_type: draft.productType.trim(),
      detail: params,
      original_price: Number(draft.originalPrice || 0),
      images: draft.images,
      seller,
      seller_id: seller.id,
      promotion: promotion ?? null,
    })
    state.openForm[sellerId] = undefined
    delete state.productDraft[sellerId]
    await loadProfileData()
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '创建商品失败')
  }
}

async function handleCreatePromotion(form: HTMLFormElement, sellerId: string): Promise<void> {
  const data = new FormData(form)

  try {
    await createObject('promotion', {
      name: String(data.get('name') ?? '').trim(),
      start_time: String(data.get('start_time') ?? ''),
      end_time: String(data.get('end_time') ?? ''),
      discount_rate: Number(data.get('discount_rate') ?? 0),
      seller_id: sellerId,
    })
    state.openForm[sellerId] = undefined
    await loadProfileData()
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '创建促销失败')
  }
}

async function handlePickImages(sellerId: string, input: HTMLInputElement): Promise<void> {
  if (!input.files || input.files.length === 0) return

  const form = input.closest<HTMLFormElement>('form[data-action="create-product"]')
  if (form) syncProductDraftFromForm(form, sellerId)

  const draft = productDraft(sellerId)
  draft.uploading = true
  render()

  try {
    for (const file of Array.from(input.files)) {
      const uploaded = await uploadImage(file)
      draft.images.push(uploaded)
      render()
    }
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '图片上传失败')
  } finally {
    draft.uploading = false
    render()
  }
}
 
function bindEvents(): void {
  const root = document.querySelector<HTMLElement>('[data-page="profile"]')
  if (!root) return

  root.addEventListener('submit', (event) => {
    const form = event.target
    if (!(form instanceof HTMLFormElement)) return
    event.preventDefault()

    switch (form.dataset.action) {
      case 'auth':
        void handleAuthSubmit(form)
        break
      case 'create-seller':
        void handleCreateSeller(form)
        break
      case 'create-product':
        void handleCreateProduct(form, form.dataset.seller ?? '')
        break
      case 'create-promotion':
        void handleCreatePromotion(form, form.dataset.seller ?? '')
        break
      case 'update-product': {
        const sellerId = form.dataset.seller ?? ''
        const id = state.editing[sellerId]?.id
        if (id) void handleUpdate('product', id, form, sellerId)
        break
      }
      case 'update-promotion': {
        const sellerId = form.dataset.seller ?? ''
        const id = state.editing[sellerId]?.id
        if (id) void handleUpdate('promotion', id, form, sellerId)
        break
      }
    }
  })

  root.addEventListener('input', (event) => {
    const field = event.target
    if (!(field instanceof HTMLInputElement)) return

    if (field.closest('.auth-card')) {
      if (field.name === 'account') state.draft.account = field.value
      else if (field.name === 'password') state.draft.password = field.value
      else if (field.name === 'name') state.draft.name = field.value
      return
    }

    const form = field.closest<HTMLFormElement>('form')
    const sellerId = form?.dataset.seller
    if (!form || !sellerId) return

    if (form.dataset.action === 'create-product' || form.dataset.action === 'update-product') {
      syncProductDraftFromForm(form, sellerId)
      return
    }

    // 促销表单：同步进草稿
    if (form.dataset.action === 'update-promotion' || form.dataset.action === 'create-promotion') {
      const draft = state.promotionDraft[sellerId]
      if (!draft) return
      if (field.name === 'name') draft.name = field.value
      else if (field.name === 'start_time') draft.startTime = field.value
      else if (field.name === 'end_time') draft.endTime = field.value
      else if (field.name === 'discount_rate') draft.discountRate = field.value
    }
  })

  root.addEventListener('change', (event) => {
    const target = event.target

    if (target instanceof HTMLSelectElement) {
      const form = target.closest<HTMLFormElement>('form')
      const sellerId = form?.dataset.seller
      if (form && sellerId) syncProductDraftFromForm(form, sellerId)
      return
    }

    if (!(target instanceof HTMLInputElement)) return
    if (target.dataset.action !== 'pick-images') return
    const sellerId = target.dataset.seller ?? ''
    if (sellerId) void handlePickImages(sellerId, target)
  })

  root.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const button = target.closest<HTMLButtonElement>('[data-action]')
    if (!button) return

    switch (button.dataset.action) {
      case 'switch-auth':
        state.authMode = state.authMode === 'login' ? 'register' : 'login'
        state.message = null
        render()
        break
      case 'logout':
        void logout().then(() => render())
        break
      case 'unfollow':
        void handleUnfollow(button.dataset.type as ObjectName, button.dataset.id ?? '')
        break
      case 'toggle-seller-form':
        state.sellerFormOpen = !state.sellerFormOpen
        render()
        break
      case 'toggle-form': {
        const sellerId = button.dataset.seller ?? ''
        const kind = button.dataset.kind as 'product' | 'promotion'
        state.openForm[sellerId] = state.openForm[sellerId] === kind ? undefined : kind
        render()
        break
      }
      case 'add-param': {
        const sellerId = button.dataset.seller ?? ''
        productDraft(sellerId).params.push({ key: '', value: '' })
        render()
        break
      }
      case 'remove-image': {
        const sellerId = button.dataset.seller ?? ''
        const imageId = button.dataset.image ?? ''
        const draft = productDraft(sellerId)
        draft.images = draft.images.filter((item) => item.id !== imageId)
        render()
        break
      }
      case 'delete-product':
        void handleDelete('product', button.dataset.id ?? '')
        break
      case 'delete-promotion':
        void handleDelete('promotion', button.dataset.id ?? '')
        break
      case 'edit-product': {
        const product = state.products.find((item) => item.id === button.dataset.id)
        if (product) startEditing(product.seller_id, 'product', product.id)
        break
      }
      case 'edit-promotion': {
        const promotion = state.promotions.find((item) => item.id === button.dataset.id)
        if (promotion) startEditing(promotion.seller_id, 'promotion', promotion.id)
        break
      }
    }
  })
}

export async function refreshProfile(): Promise<void> {
  if (!getUser()) {
    render()
    return
  }

  try {
    await loadProfileData()
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '加载失败')
  }
}

export function setupProfile(): void {
  bindEvents()
  subscribe(() => render())
  render()
}
