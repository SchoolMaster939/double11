(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`double11.token`,t=`http://127.0.0.1:8000`;function n(){return window.pywebview?.api?window.pywebview.api.get_base_url():new Promise(e=>{let n=window.setTimeout(()=>{window.removeEventListener(`pywebviewready`,r),e(t)},1e3),r=()=>{window.clearTimeout(n),e(window.pywebview.api.get_base_url())};window.addEventListener(`pywebviewready`,r,{once:!0})})}var r=null;function i(){return r??=n(),r}function a(){return window.localStorage.getItem(e)}function o(t){t?window.localStorage.setItem(e,t):window.localStorage.removeItem(e)}async function s(e,t){let n=await i(),r=a(),o=await fetch(`${n}${e}`,{...t,headers:{...t?.rawBody?{}:{"Content-Type":`application/json`},...r?{Authorization:`Bearer ${r}`}:{},...t?.headers}});if(!o.ok){let e=`请求失败(${o.status})`;try{let t=await o.json();t?.detail&&(e=typeof t.detail==`string`?t.detail:JSON.stringify(t.detail))}catch{}throw Error(e)}if(o.status===204)return;let s=await o.text();return s?JSON.parse(s):void 0}function ee(e){let t=new FormData;return t.append(`file`,e),s(`/upload/image`,{method:`POST`,body:t,rawBody:!0})}function te(e,t,n){return s(`/auth/register`,{method:`POST`,body:JSON.stringify({account:e,password:t,name:n})})}function ne(e,t){return s(`/auth/login`,{method:`POST`,body:JSON.stringify({account:e,password:t})})}function c(){return s(`/auth/me`)}function re(){return s(`/auth/logout`,{method:`POST`})}function ie(e,t){return s(`/follows/${e}/${encodeURIComponent(t)}`,{method:`POST`})}function l(e,t){return s(`/follows/${e}/${encodeURIComponent(t)}`,{method:`DELETE`})}function ae(){return s(`/cart`)}function oe(e,t=1){return s(`/cart`,{method:`POST`,body:JSON.stringify({product_id:e,quantity:t})})}function se(e,t){return s(`/cart/${encodeURIComponent(e)}`,{method:`PUT`,body:JSON.stringify({quantity:t})})}function ce(e){return s(`/cart/${encodeURIComponent(e)}`,{method:`DELETE`})}function u(e){return s(`/${e}`)}function d(e,t){return s(`/${e}`,{method:`POST`,body:JSON.stringify(t)})}function f(e,t,n){return s(`/${e}/${encodeURIComponent(t)}`,{method:`PUT`,body:JSON.stringify(n)})}function le(e,t){return s(`/${e}/${encodeURIComponent(t)}`,{method:`DELETE`})}var p={user:null,restoring:!1},m=new Set;function ue(){for(let e of m)e(p)}function h(e){p={...p,...e},ue()}function de(e){return m.add(e),e(p),()=>m.delete(e)}function g(){return p.user}function fe(e){return{id:e.id,account:e.account,name:e.name,avatar:e.avatar,created_at:e.created_at}}async function pe(){if(a()){h({restoring:!0});try{h({user:fe(await c())})}catch{o(null),h({user:null})}finally{h({restoring:!1})}}}async function me(e,t,n){let r=await te(e,t,n);o(r.token),h({user:r.user})}async function he(e,t){let n=await ne(e,t);o(n.token),h({user:n.user})}async function ge(){try{await re()}catch{}o(null),h({user:null})}var _={items:[],products:[],loading:!1,message:null},_e=``;function v(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function ve(e){return e?e.startsWith(`http`)||e.startsWith(`data:`)?e:`${_e}${e}`:``}function y(e){return _.products.find(t=>t.id===e.product_id)}function b(e){return e.promotion?e.original_price*e.promotion.discount_rate:e.original_price}function x(e){return`￥${e.toFixed(2)}`}function S(){return _.items.reduce((e,t)=>{let n=y(t);return n?e+b(n)*t.quantity:e},0)}function ye(e,t){let n=y(e),r=n?.name||`商品已下架`,i=n?.images[0],a=n?b(n):0;return`
    <article class="cart-row" style="--row-index:${t}">
      <div class="cart-row__media">
        ${i?`<img src="${v(ve(i.url))}" alt="${v(r)}" />`:`<span class="product-card__placeholder">${v(r.charAt(0))}</span>`}
      </div>
      <div>
        <h3>${v(r)}</h3>
        <small>${n?v(n.product_type):`未知类别`} · 单价 ${x(a)}</small>
      </div>
      <div class="cart-qty">
        <button type="button" data-action="decrease" data-id="${v(e.id)}" aria-label="减少数量">−</button>
        <span>${e.quantity}</span>
        <button type="button" data-action="increase" data-id="${v(e.id)}" aria-label="增加数量">+</button>
        <button type="button" data-action="remove" data-id="${v(e.id)}" aria-label="移除">×</button>
      </div>
      <div class="cart-row__price">${x(a*e.quantity)}</div>
    </article>
  `}function C(){let e=document.querySelector(`[data-page="cart"]`);e&&(e.innerHTML=g()?`
    <div class="cart-page">
      <div class="catalog-head">
        <div>
          <h1>购物车</h1>
          <p>${_.loading?`正在加载…`:`共 ${_.items.length} 件商品`}</p>
        </div>
        ${_.message?`<p class="form-message form-message--ok">${v(_.message)}</p>`:``}
      </div>

      ${_.items.length===0?`<p class="cart-empty">购物车还是空的</p>`:`<div class="cart-list">${_.items.map(ye).join(``)}</div>
             <div class="cart-summary">
               <span>合计</span>
               <strong>${x(S())}</strong>
             </div>
             <div class="profile-actions" style="justify-content:flex-end;margin-top:0.9rem">
               <button class="btn btn--primary" type="button" data-action="checkout">结算</button>
             </div>`}
    </div>
  `:`
      <div class="cart-page">
        <h1>购物车</h1>
        <p class="cart-empty">登录后才能查看购物车</p>
      </div>`)}async function be(){_.loading=!0,C();try{let[e,t]=await Promise.all([ae(),u(`product`)]);_.items=e,_.products=t}catch(e){_.message=e instanceof Error?e.message:`购物车加载失败`}finally{_.loading=!1,C()}}function xe(e){_.message=e,C(),window.setTimeout(()=>{_.message=null,C()},1600)}async function w(e,t){let n=e.quantity+t;try{n<=0?await ce(e.id):await se(e.id,n),_.items=n<=0?_.items.filter(t=>t.id!==e.id):_.items.map(t=>t.id===e.id?{...t,quantity:n}:t),C()}catch(e){xe(e instanceof Error?e.message:`更新数量失败`)}}function Se(){window.alert(`订单已提交\n\n合计：${x(S())}\n共 ${_.items.length} 种商品`)}function Ce(){let e=document.querySelector(`[data-page="cart"]`);e&&e.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof HTMLElement))return;let n=t.closest(`[data-action]`);if(!n)return;let r=_.items.find(e=>e.id===n.dataset.id);switch(n.dataset.action){case`increase`:r&&w(r,1);break;case`decrease`:r&&w(r,-1);break;case`remove`:r&&w(r,-r.quantity);break;case`checkout`:Se()}})}async function we(){g()?await be():C()}function Te(){i().then(e=>{_e=e,C()}),Ce()}var T={buy:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16l-1.5 12.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 7Z"/><path d="M8.5 7V5.5a3.5 3.5 0 1 1 7 0V7"/></svg>`,cart:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>`,detail:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>`,collapse:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>`,follow:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>`,followed:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>`},E={products:[],sellers:[],active:null,followed:new Set,loading:!1,query:``,message:null},D=``,Ee=0,O=!1;function k(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function De(e){return e?e.startsWith(`http`)||e.startsWith(`data:`)?e:`${D}${e}`:``}function Oe(e){return e.promotion?e.original_price*e.promotion.discount_rate:e.original_price}function ke(e){if(!e)return!1;let t=Date.now(),n=Date.parse(e.start_time),r=Date.parse(e.end_time);return Number.isNaN(n)||Number.isNaN(r)?!0:t>=n&&t<=r}function A(e){return`￥${e.toFixed(2)}`}function j(e){return e.seller?.name?e.seller.name:E.sellers.find(t=>t.id===e.seller_id)?.name??`未知商家`}function Ae(e){return`<span class="product-card__placeholder">${k((e.name||e.product_type||`?`).trim().charAt(0))}</span>`}function M(e,t){return`${e}:${t}`}function je(e,t){return E.followed.has(M(e,t))}function Me(e){return!E.query||[e.name,e.product_type,j(e),...Object.entries(e.detail).flatMap(([e,t])=>[e,t])].join(` `).toLowerCase().includes(E.query)}function N(){return E.query?E.products.filter(Me):E.products}function P(e,t,n){let r=je(e,t);return`
    <button class="follow-btn${r?` is-followed`:``}" type="button"
            data-action="follow" data-type="${e}" data-id="${k(t)}">
      ${r?T.followed:T.follow}
      <span>${r?`已关注`:n}</span>
    </button>
  `}function Ne(e,t){let n=e.images[0],r=ke(e.promotion),i=Oe(e),a=Object.entries(e.detail).filter(([e,t])=>e&&t),o=e.seller?.id||e.seller_id,s=e.promotion;return`
    <article class="product-card" data-id="${k(e.id)}" style="--card-index:${t}">
      <div class="product-card__media">
        ${n?`<img class="product-card__img" src="${k(De(n.url))}" alt="${k(e.name)}" loading="lazy" />`:Ae(e)}
        ${r&&s?`<span class="product-card__badge">${Math.round(s.discount_rate*100)}% 促销</span>`:``}
      </div>

      <!-- 收起态内容 -->
      <div class="product-card__body product-card__body--compact">
        <p class="product-card__type">${k(e.product_type)}</p>
        <h3>${k(e.name||`未命名商品`)}</h3>
        <p class="product-card__seller">${k(j(e))}</p>

        <div class="product-card__price">
          <strong>${A(i)}</strong>
          ${r?`<s>${A(e.original_price)}</s>
                 <span class="product-card__discount">省 ${A(e.original_price-i)}</span>`:``}
        </div>

        <div class="product-card__actions">
          <button class="icon-btn icon-btn--primary" type="button"
                  data-action="buy" data-id="${k(e.id)}" aria-label="购买">
            ${T.buy}<span>购买</span>
          </button>
          <button class="icon-btn" type="button"
                  data-action="cart" data-id="${k(e.id)}" aria-label="加入购物车">
            ${T.cart}<span>购物车</span>
          </button>
          <button class="icon-btn" type="button"
                  data-action="detail" data-id="${k(e.id)}" aria-label="查看详情">
            ${T.detail}<span>详情</span>
          </button>
        </div>
      </div>

      <!-- 展开态内容：左图右参数 -->
      <div class="product-card__detail">
        <button class="collapse-btn" type="button" data-action="close-detail" aria-label="收起详情">
          ${T.collapse}<span>收起</span>
        </button>

        <div class="detail-right">
          <header class="detail-head">
            <p class="product-card__type">${k(e.product_type)}</p>
            <h2>${k(e.name||`未命名商品`)}</h2>
            <p class="product-card__seller">${k(j(e))}</p>
          </header>

          <div class="detail-price">
            <strong>${A(i)}</strong>
            ${r?`<s>${A(e.original_price)}</s>`:``}
            ${s?`<span class="detail-promo">
                     ${k(s.name)} · ${Math.round(s.discount_rate*100)}% ·
                     ${k(s.start_time.slice(0,10))} ~ ${k(s.end_time.slice(0,10))}
                   </span>`:``}
          </div>

          <dl class="detail-params">
            ${a.length===0?`<dt>参数</dt><dd>暂无</dd>`:a.map(([e,t])=>`<dt>${k(e)}</dt><dd>${k(t)}</dd>`).join(``)}
          </dl>

          <div class="detail-follows">
            ${P(`product`,e.id,`关注商品`)}
            ${o?P(`seller`,o,`关注店铺`):`<button class="follow-btn" type="button" disabled><span>暂无店铺</span></button>`}
            ${s?P(`promotion`,s.id,`关注促销`):`<button class="follow-btn" type="button" disabled><span>暂无促销</span></button>`}
          </div>

          <div class="detail-actions">
            <button class="icon-btn icon-btn--primary" type="button" data-action="buy" data-id="${k(e.id)}">
              ${T.buy}<span>购买</span>
            </button>
            <button class="icon-btn" type="button" data-action="cart" data-id="${k(e.id)}">
              ${T.cart}<span>加入购物车</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  `}function Pe(){return`<div class="product-card product-card--skeleton" aria-hidden="true">
    <div class="product-card__media"></div>
    <div class="product-card__body">
      <span class="skeleton-line"></span>
      <span class="skeleton-line skeleton-line--short"></span>
      <span class="skeleton-line skeleton-line--price"></span>
    </div>
  </div>`}function Fe(){document.querySelectorAll(`.product-card`).forEach(e=>{e.addEventListener(`animationend`,()=>e.classList.add(`is-settled`),{once:!0})})}function Ie(){return E.loading?Pe().repeat(6):N().map((e,t)=>Ne(e,t)).join(``)}function Le(){return!E.query||E.loading||N().length>0?``:`
    <p class="empty catalog-empty">
      没有找到匹配「${k(E.query)}」的商品
    </p>
  `}function F(){let e=document.querySelector(`[data-page="home"]`);if(!e)return;let t=N().length,n=E.products.length;e.innerHTML=`
    <header class="catalog-head">
      <div>
        <h1>双十一寻宝</h1>
        <p>${E.loading?`正在加载商品…`:E.query?`搜索「${k(E.query)}」，找到 ${t} 件`:`共 ${n} 件商品`}</p>
      </div>
      ${E.message?`<p class="form-message form-message--ok">${k(E.message)}</p>`:``}
    </header>

    ${!E.loading&&n===0?`<p class="empty">还没有商品，去个人中心注册商家后添加吧</p>`:``}
    ${Le()}
    <div class="product-grid" id="productGrid">${Ie()}</div>
  `,Fe()}function I(e){let t=e.getBoundingClientRect();return{width:t.width,height:t.height}}function Re(e){let t=document.getElementById(`productGrid`);if(!t)return;let n=I(e);t.classList.add(`is-expanded-mode`),e.classList.add(`is-expanded`,`is-transitioning`);let r=I(e);if(n.width<=0||r.width<=0){e.classList.remove(`is-transitioning`);return}let i=e.animate([{width:`${n.width}px`,height:`${n.height}px`},{width:`${r.width}px`,height:`${r.height}px`}],{duration:520,easing:`cubic-bezier(.22, .61, .36, 1)`,fill:`both`});i.onfinish=()=>{i.cancel(),e.classList.remove(`is-transitioning`)}}function ze(e){let t=document.getElementById(`productGrid`);if(!t)return;let n=I(e);e.classList.remove(`is-expanded`),e.classList.add(`is-transitioning`),t.classList.remove(`is-expanded-mode`);let r=I(e);if(n.width<=0||r.width<=0){e.classList.remove(`is-transitioning`);return}let i=e.animate([{width:`${n.width}px`,height:`${n.height}px`},{width:`${r.width}px`,height:`${r.height}px`}],{duration:420,easing:`cubic-bezier(.22, .61, .36, 1)`,fill:`both`});i.onfinish=()=>{i.cancel(),e.classList.remove(`is-transitioning`),document.querySelector(`.product-card.is-expanded`)||(E.active=null)}}function Be(e){if(E.active?.id===e.id||document.querySelector(`.product-card.is-expanded`))return;let t=document.querySelector(`.product-card[data-id="${e.id}"]`);t&&(E.active=e,Re(t))}function L(){let e=document.querySelector(`.product-card.is-expanded`);E.active=null,e?ze(e):document.getElementById(`productGrid`)?.classList.remove(`is-expanded-mode`)}async function R(){E.loading=!0,F();try{let[e,t]=await Promise.all([u(`product`),u(`seller`)]);E.products=e,E.sellers=t,await Ve()}catch(e){E.message=e instanceof Error?e.message:`商品加载失败`}finally{E.loading=!1,F()}}async function Ve(){if(E.followed.clear(),g())try{let e=await c();for(let t of e.follows)E.followed.add(M(t.target_type,t.target_id))}catch{}}function z(e){E.message=e,F(),window.setTimeout(()=>{E.message=null,F()},1800)}async function He(e){if(!g())z(`请先登录后再加入购物车`);else try{await oe(e.id),z(`已加入购物车：${e.name||`商品`}`)}catch(e){z(e instanceof Error?e.message:`加入购物车失败`)}}function Ue(e){let t=Oe(e);window.alert(`订单已确认\n\n${e.name||`商品`}\n单价：${A(t)}\n数量：1\n合计：${A(t)}`)}async function We(e,t){if(!g()){z(`请先登录后再关注`);return}let n=M(e,t),r=E.followed.has(n);try{r?await l(e,t):await ie(e,t),r?E.followed.delete(n):E.followed.add(n),document.querySelector(`.product-card.is-expanded`)?.querySelectorAll(`.follow-btn`).forEach(n=>{if(n.dataset.type!==e||n.dataset.id!==t)return;let r=E.followed.has(M(e,t));n.classList.toggle(`is-followed`,r),n.innerHTML=`${r?T.followed:T.follow}<span>${r?`已关注`:Ge(e)}</span>`})}catch(e){z(e instanceof Error?e.message:`关注失败`)}}function Ge(e){return e===`seller`?`关注店铺`:e===`promotion`?`关注促销`:`关注商品`}function Ke(e){let t=e.target;if(!(t instanceof HTMLElement))return;let n=t.closest(`[data-action]`);if(n)switch(n.dataset.action){case`detail`:{let e=E.products.find(e=>e.id===n.dataset.id);if(!e||E.active)return;Be(e);break}case`close-detail`:L();break;case`follow`:We(n.dataset.type,n.dataset.id??``);break;case`cart`:{let e=E.products.find(e=>e.id===n.dataset.id);e&&He(e);break}case`buy`:{let e=E.products.find(e=>e.id===n.dataset.id);e&&Ue(e);break}}}function qe(e){e.key===`Escape`&&E.active&&L()}function Je(){if(O)return;O=!0;let e=document.querySelector(`[data-page="home"]`);e?(e.addEventListener(`click`,Ke),document.addEventListener(`keydown`,qe)):O=!1}async function Ye(){E.active&&=(Ee+=1,null),await R()}function B(e){let t=e.trim().toLowerCase();if(t===E.query)return;let n=!!document.querySelector(`.product-card.is-expanded`);E.query=t,n&&(Ee+=1,E.active=null),F()}function Xe(){i().then(e=>{D=e,F()}),Je(),R()}function Ze(){return{name:``,productType:``,originalPrice:``,promotionId:``,params:[{key:``,value:``}],images:[],uploading:!1}}var V={authMode:`login`,draft:{account:``,password:``,name:``},busy:!1,message:null,follows:[],products:[],promotions:[],sellers:[],mySellers:[],openForm:{},sellerFormOpen:!1,productDraft:{},editing:{},promotionDraft:{}},Qe={product:`商品`,promotion:`促销`,seller:`商家`};function H(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}var U=``;i().then(e=>{U=e});function W(e){return e?e.startsWith(`http`)||e.startsWith(`data:`)?e:`${U}${e}`:``}function $e(e,t){return t?`<img class="profile-avatar" src="${H(t)}" alt="${H(e)}" />`:`<span class="profile-avatar profile-avatar--text">${H(e.trim().charAt(0).toUpperCase()||`?`)}</span>`}function G(e){return`${Math.round(e*100)}%`}function K(e){return e.length>=10?e.slice(0,10):e}function q(e,t){return`${K(e)} ~ ${K(t)}`}function J(e){let t=Object.entries(e).filter(([e,t])=>e.trim()&&t.trim());return t.length===0?`未填写参数`:t.map(([e,t])=>`${e} ${t}`).join(` · `)}function Y(e){return V.productDraft[e]??=Ze(),V.productDraft[e]}function et(e){let t=V.follows.filter(t=>t.target_type===e).map(e=>e.target_id);return e===`product`?t.map(e=>V.products.find(t=>t.id===e)).filter(e=>!!e).map(e=>({id:e.id,label:e.name||J(e.detail),meta:`￥${e.original_price.toFixed(2)} · ${e.product_type} · ${J(e.detail)}`,thumbnail:e.images[0]?W(e.images[0].url):``})):e===`promotion`?t.map(e=>V.promotions.find(t=>t.id===e)).filter(e=>!!e).map(e=>({id:e.id,label:e.name,meta:`${G(e.discount_rate)} · ${q(e.start_time,e.end_time)}`,thumbnail:``})):t.map(e=>V.sellers.find(t=>t.id===e)).filter(e=>!!e).map(e=>({id:e.id,label:e.name,meta:`商家`,thumbnail:``}))}function tt(){let{authMode:e,draft:t,busy:n,message:r}=V,i=e===`login`;return`
    <form class="auth-card" data-action="auth" novalidate>
      <div class="profile-headline">
        <h1>${i?`登录`:`注册`}</h1>
        <p>登录后可以查看关注的商品、促销和商家，也可以注册自己的商家。</p>
      </div>

      <label class="field">
        <span>账号</span>
        <input name="account" type="text" value="${H(t.account)}" autocomplete="username" />
      </label>

      <label class="field">
        <span>密码</span>
        <input name="password" type="password" value="${H(t.password)}"
               autocomplete="${i?`current-password`:`new-password`}" />
      </label>

      ${i?``:`<label class="field">
               <span>昵称<span class="field-hint">不填则用账号</span></span>
               <input name="name" type="text" value="${H(t.name)}" autocomplete="nickname" />
             </label>`}

      ${r?`<p class="form-message form-message--${r.kind}">${H(r.text)}</p>`:``}

      <div class="profile-actions">
        <button class="btn btn--primary" type="submit" ${n?`disabled`:``}>
          ${n?`请稍候…`:i?`登录`:`注册`}
        </button>
        <button class="btn btn--ghost" type="button" data-action="switch-auth" ${n?`disabled`:``}>
          ${i?`还没有账号？去注册`:`已经有账号？去登录`}
        </button>
      </div>
    </form>
  `}function nt(){return`
    <div class="follow-grid">
      ${[`product`,`promotion`,`seller`].map(e=>{let t=et(e);return`
            <section class="follow-card">
              <header>
                <h2>${Qe[e]}</h2>
                <span class="count">${t.length}</span>
              </header>
              ${t.length===0?`<p class="empty">还没有关注</p>`:`<ul>${t.map(t=>`
                      <li>
                        ${t.thumbnail?`<img class="follow-thumb" src="${H(t.thumbnail)}" alt="" />`:``}
                        <div>
                          <strong>${H(t.label)}</strong>
                          <small>${H(t.meta)}</small>
                        </div>
                        <button class="link" type="button"
                                data-action="unfollow" data-type="${e}" data-id="${H(t.id)}">
                          取消关注
                        </button>
                      </li>`).join(``)}</ul>`}
            </section>
          `}).join(``)}
    </div>
  `}function rt(){let e=g();return e?`
    <section class="user-card">
      ${$e(e.name,e.avatar)}
      <div class="user-card__meta">
        <h1>${H(e.name)}</h1>
        <p>账号 ${H(e.account)}</p>
      </div>
      <button class="btn btn--ghost" type="button" data-action="logout">退出登录</button>
    </section>
  `:``}function it(e){let t=Y(e.id),n=V.editing[e.id]?.kind===`product`;return`
    <form class="inline-form inline-form--product"
          data-action="${n?`update-product`:`create-product`}"
          data-seller="${H(e.id)}">
      <label class="field"><span>商品名称</span>
        <input name="name" type="text" placeholder="例如：xx电脑"
               value="${H(t.name)}" required />
      </label>
      <label class="field"><span>类别</span>
        <input name="product_type" type="text" placeholder="数码 / 零食"
               value="${H(t.productType)}" required />
      </label>
      <label class="field"><span>原价</span>
        <input name="original_price" type="number" min="0" step="0.01"
               value="${H(t.originalPrice)}" required />
      </label>
      <label class="field"><span>促销</span>
        <select name="promotion_id">
          <option value="">不参与促销</option>
          ${V.promotions.map(e=>`<option value="${H(e.id)}"${e.id===t.promotionId?` selected`:``}>${H(e.name)}（${H(q(e.start_time,e.end_time))}）</option>`).join(``)}
        </select>
      </label>

      <fieldset class="param-block">
        <legend>具体参数</legend>
        <div class="param-rows">
          ${t.params.map((e,t)=>`
            <div class="param-row">
              <input name="param-key" type="text" placeholder="参数名" value="${H(e.key)}"
                     data-param-index="${t}" data-param-side="key" />
              <input name="param-value" type="text" placeholder="参数值" value="${H(e.value)}"
                     data-param-index="${t}" data-param-side="value" />
            </div>`).join(``)}
        </div>
        <button class="link" type="button" data-action="add-param" data-seller="${H(e.id)}">
          + 增加一行参数
        </button>
      </fieldset>

      <fieldset class="image-block">
        <legend>商品图片</legend>
        <input type="file" accept="image/*" multiple data-action="pick-images"
               data-seller="${H(e.id)}" ${t.uploading?`disabled`:``} />
        <div class="image-preview">
          ${t.images.map(t=>`
            <span class="image-preview__item">
              <img src="${H(W(t.url))}" alt="" />
              <button type="button" class="image-preview__remove"
                      data-action="remove-image" data-seller="${H(e.id)}"
                      data-image="${H(t.id)}">×</button>
            </span>`).join(``)}
        </div>
      </fieldset>

      <button class="btn btn--primary" type="submit" ${t.uploading?`disabled`:``}>
        ${t.uploading?`图片上传中…`:n?`保存修改`:`创建商品`}
      </button>
    </form>
  `}function at(e){let t=V.editing[e.id]?.kind===`promotion`,n=t?V.promotionDraft[e.id]??{name:``,startTime:``,endTime:``,discountRate:``}:{name:``,startTime:``,endTime:``,discountRate:``};return`
    <form class="inline-form" data-action="${t?`update-promotion`:`create-promotion`}"
          data-seller="${H(e.id)}">
      <label class="field"><span>名称</span>
        <input name="name" type="text" value="${H(n.name)}" required />
      </label>
      <label class="field"><span>开始时间</span>
        <input name="start_time" type="datetime-local" value="${H(n.startTime)}" required />
      </label>
      <label class="field"><span>结束时间</span>
        <input name="end_time" type="datetime-local" value="${H(n.endTime)}" required />
      </label>
      <label class="field"><span>折扣（0~1）</span>
        <input name="discount_rate" type="number" min="0" max="1" step="0.01"
               value="${H(n.discountRate)}" required />
      </label>
      <button class="btn btn--primary" type="submit">${t?`保存修改`:`创建促销`}</button>
    </form>
  `}function ot(e){let t=V.products.filter(t=>t.seller_id===e),n=new Set(t.map(e=>e.promotion?.id).filter(e=>!!e));return{products:t,promotions:V.promotions.filter(t=>t.seller_id===e||n.has(t.id))}}function st(e){let{products:t,promotions:n}=ot(e),r=t.map(e=>`
      <li>
        <div>
          <strong>${H(e.name||J(e.detail))}</strong>
          <small>￥${e.original_price.toFixed(2)} · ${H(e.product_type)}</small>
        </div>
        <div>
          <button class="link" type="button" data-action="edit-product" data-id="${H(e.id)}">修改</button>
          <button class="link" type="button" data-action="delete-product" data-id="${H(e.id)}">删除</button>
        </div>
      </li>`).join(``),i=n.map(e=>`
      <li>
        <div>
          <strong>${H(e.name)}</strong>
          <small>${G(e.discount_rate)} · ${H(q(e.start_time,e.end_time))}</small>
        </div>
        <div>
          <button class="link" type="button" data-action="edit-promotion" data-id="${H(e.id)}">修改</button>
          <button class="link" type="button" data-action="delete-promotion" data-id="${H(e.id)}">删除</button>
        </div>
      </li>`).join(``);return`
    <div class="inventory">
      <div class="inventory__col">
        <h4>已加入商品 <span class="count">${t.length}</span></h4>
        ${t.length===0?`<p class="empty">暂无商品</p>`:`<ul>${r}</ul>`}
      </div>
      <div class="inventory__col">
        <h4>已加入促销 <span class="count">${n.length}</span></h4>
        ${n.length===0?`<p class="empty">暂无促销</p>`:`<ul>${i}</ul>`}
      </div>
    </div>
  `}function ct(e){let t=V.openForm[e.id];return`
    <article class="seller-row">
      <header>
        <div>
          <h3>${H(e.name)}</h3>
          <small>商家 ID：${H(e.id)}</small>
        </div>
        <div class="seller-row__actions">
          <button class="btn btn--ghost" type="button"
                  data-action="toggle-form" data-seller="${H(e.id)}" data-kind="product">
            加入商品
          </button>
          <button class="btn btn--ghost" type="button"
                  data-action="toggle-form" data-seller="${H(e.id)}" data-kind="promotion">
            加入促销
          </button>
        </div>
      </header>

      ${st(e.id)}

      ${t===`product`?it(e):``}
      ${t===`promotion`?at(e):``}
    </article>
  `}function lt(){return`
    <section class="seller-section">
      <header class="section-head">
        <h2>我的商家</h2>
        <button class="btn btn--primary" type="button" data-action="toggle-seller-form">
          ${V.sellerFormOpen?`收起`:`注册商家`}
        </button>
      </header>

      ${V.sellerFormOpen?`<form class="inline-form" data-action="create-seller">
               <label class="field"><span>商家名称</span><input name="name" type="text" required /></label>
               <button class="btn btn--primary" type="submit">创建商家</button>
             </form>`:``}

      ${V.mySellers.length===0?`<p class="empty">还没有注册商家</p>`:V.mySellers.map(ct).join(``)}
    </section>
  `}function X(){let e=document.querySelector(`[data-page="profile"]`);e&&(e.innerHTML=g()?`${rt()}${nt()}${lt()}`:tt())}async function Z(){let[e,t,n,r]=await Promise.all([u(`product`),u(`promotion`),u(`seller`),c()]);V.products=e,V.promotions=t,V.sellers=n,V.follows=r.follows,V.mySellers=n.filter(e=>e.owner_id===r.id),X()}function Q(e,t=`error`){V.message={text:e,kind:t},X()}async function ut(e){let t=new FormData(e),n=String(t.get(`account`)??``).trim(),r=String(t.get(`password`)??``),i=String(t.get(`name`)??``).trim();if(!n||!r)Q(`账号和密码都不能为空`);else{V.busy=!0,X();try{V.authMode===`login`?await he(n,r):await me(n,r,i),V.busy=!1,V.message=null,V.draft={account:``,password:``,name:``},await Z()}catch(e){V.busy=!1,Q(e instanceof Error?e.message:`操作失败`)}}}async function dt(e,t){try{await l(e,t),V.follows=V.follows.filter(n=>n.target_type!==e||n.target_id!==t),X()}catch(e){Q(e instanceof Error?e.message:`取消失败`)}}async function ft(e){let t=g();if(!t)return;let n=String(new FormData(e).get(`name`)??``).trim();if(n)try{await d(`seller`,{name:n,owner_id:t.id}),V.sellerFormOpen=!1,await Z()}catch(e){Q(e instanceof Error?e.message:`创建商家失败`)}}function pt(e,t,n){let r=t===`product`?V.products.find(e=>e.id===n):void 0,i=t===`promotion`?V.promotions.find(e=>e.id===n):void 0;(r||i)&&(V.editing[e]={kind:t,id:n},V.openForm[e]=t,r&&(V.productDraft[e]={name:r.name,productType:r.product_type,originalPrice:String(r.original_price),promotionId:r.promotion?.id??``,params:Object.entries(r.detail).map(([e,t])=>({key:e,value:t})),images:[...r.images],uploading:!1}),i&&(V.promotionDraft[e]={name:i.name,startTime:i.start_time.slice(0,16),endTime:i.end_time.slice(0,16),discountRate:String(i.discount_rate)}),X())}async function mt(e,t,n,r){try{if(e===`product`){$(n,r);let e=Y(r),i={};for(let t of e.params){let e=t.key.trim();e&&(i[e]=t.value.trim())}await f(`product`,t,{name:e.name.trim(),product_type:e.productType.trim(),original_price:Number(e.originalPrice||0),detail:i,images:e.images,promotion:V.promotions.find(t=>t.id===e.promotionId)??null})}else{let e=new FormData(n),i=V.promotionDraft[r]??{name:``,startTime:``,endTime:``,discountRate:``};i.name=String(e.get(`name`)??i.name),i.startTime=String(e.get(`start_time`)??i.startTime),i.endTime=String(e.get(`end_time`)??i.endTime),i.discountRate=String(e.get(`discount_rate`)??i.discountRate),await f(`promotion`,t,{name:i.name.trim(),start_time:i.startTime,end_time:i.endTime,discount_rate:Number(i.discountRate||0)})}V.editing[r]=void 0,V.openForm[r]=void 0,delete V.productDraft[r],delete V.promotionDraft[r],await Z()}catch(e){Q(e instanceof Error?e.message:`保存失败`)}}function $(e,t){let n=Y(t),r=e.querySelector(`[name="name"]`),i=e.querySelector(`[name="product_type"]`),a=e.querySelector(`[name="original_price"]`),o=e.querySelector(`[name="promotion_id"]`);r&&(n.name=r.value),i&&(n.productType=i.value),a&&(n.originalPrice=a.value),o&&(n.promotionId=o.value),e.querySelectorAll(`[data-param-side]`).forEach(e=>{let t=Number(e.dataset.paramIndex??-1),r=n.params[t];r&&(e.dataset.paramSide===`key`?r.key=e.value:r.value=e.value)})}async function ht(e,t){let n=e===`product`?`商品`:`促销`;if(window.confirm(`确定删除这个${n}吗？`))try{await le(e,t),V.products=V.products.filter(n=>e!==`product`||n.id!==t),V.promotions=V.promotions.filter(n=>e!==`promotion`||n.id!==t),X()}catch(e){Q(e instanceof Error?e.message:`${n}删除失败`)}}async function gt(e,t){let n=V.mySellers.find(e=>e.id===t);if(!n)return;let r=Y(t);$(e,t);let i={};for(let e of r.params){let t=e.key.trim();t&&(i[t]=e.value.trim())}let a=V.promotions.find(e=>e.id===r.promotionId);try{await d(`product`,{name:r.name.trim(),product_type:r.productType.trim(),detail:i,original_price:Number(r.originalPrice||0),images:r.images,seller:n,seller_id:n.id,promotion:a??null}),V.openForm[t]=void 0,delete V.productDraft[t],await Z()}catch(e){Q(e instanceof Error?e.message:`创建商品失败`)}}async function _t(e,t){let n=new FormData(e);try{await d(`promotion`,{name:String(n.get(`name`)??``).trim(),start_time:String(n.get(`start_time`)??``),end_time:String(n.get(`end_time`)??``),discount_rate:Number(n.get(`discount_rate`)??0),seller_id:t}),V.openForm[t]=void 0,await Z()}catch(e){Q(e instanceof Error?e.message:`创建促销失败`)}}async function vt(e,t){if(!t.files||t.files.length===0)return;let n=t.closest(`form[data-action="create-product"]`);n&&$(n,e);let r=Y(e);r.uploading=!0,X();try{for(let e of Array.from(t.files)){let t=await ee(e);r.images.push(t),X()}}catch(e){Q(e instanceof Error?e.message:`图片上传失败`)}finally{r.uploading=!1,X()}}function yt(){let e=document.querySelector(`[data-page="profile"]`);e&&(e.addEventListener(`submit`,e=>{let t=e.target;if(t instanceof HTMLFormElement)switch(e.preventDefault(),t.dataset.action){case`auth`:ut(t);break;case`create-seller`:ft(t);break;case`create-product`:gt(t,t.dataset.seller??``);break;case`create-promotion`:_t(t,t.dataset.seller??``);break;case`update-product`:{let e=t.dataset.seller??``,n=V.editing[e]?.id;n&&mt(`product`,n,t,e);break}case`update-promotion`:{let e=t.dataset.seller??``,n=V.editing[e]?.id;n&&mt(`promotion`,n,t,e);break}}}),e.addEventListener(`input`,e=>{let t=e.target;if(!(t instanceof HTMLInputElement))return;if(t.closest(`.auth-card`)){t.name===`account`?V.draft.account=t.value:t.name===`password`?V.draft.password=t.value:t.name===`name`&&(V.draft.name=t.value);return}let n=t.closest(`form`),r=n?.dataset.seller;if(n&&r){if(n.dataset.action===`create-product`||n.dataset.action===`update-product`)$(n,r);else if(n.dataset.action===`update-promotion`||n.dataset.action===`create-promotion`){let e=V.promotionDraft[r];if(!e)return;t.name===`name`?e.name=t.value:t.name===`start_time`?e.startTime=t.value:t.name===`end_time`?e.endTime=t.value:t.name===`discount_rate`&&(e.discountRate=t.value)}}}),e.addEventListener(`change`,e=>{let t=e.target;if(t instanceof HTMLSelectElement){let e=t.closest(`form`),n=e?.dataset.seller;e&&n&&$(e,n);return}if(!(t instanceof HTMLInputElement)||t.dataset.action!==`pick-images`)return;let n=t.dataset.seller??``;n&&vt(n,t)}),e.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof HTMLElement))return;let n=t.closest(`[data-action]`);if(n)switch(n.dataset.action){case`switch-auth`:V.authMode=V.authMode===`login`?`register`:`login`,V.message=null,X();break;case`logout`:ge().then(()=>X());break;case`unfollow`:dt(n.dataset.type,n.dataset.id??``);break;case`toggle-seller-form`:V.sellerFormOpen=!V.sellerFormOpen,X();break;case`toggle-form`:{let e=n.dataset.seller??``,t=n.dataset.kind;V.openForm[e]=V.openForm[e]===t?void 0:t,X();break}case`add-param`:Y(n.dataset.seller??``).params.push({key:``,value:``}),X();break;case`remove-image`:{let e=n.dataset.seller??``,t=n.dataset.image??``,r=Y(e);r.images=r.images.filter(e=>e.id!==t),X();break}case`delete-product`:ht(`product`,n.dataset.id??``);break;case`delete-promotion`:ht(`promotion`,n.dataset.id??``);break;case`edit-product`:{let e=V.products.find(e=>e.id===n.dataset.id);e&&pt(e.seller_id,`product`,e.id);break}case`edit-promotion`:{let e=V.promotions.find(e=>e.id===n.dataset.id);e&&pt(e.seller_id,`promotion`,e.id);break}}}))}async function bt(){if(!g())X();else try{await Z()}catch(e){Q(e instanceof Error?e.message:`加载失败`)}}function xt(){yt(),de(()=>X()),X()}function St(){let e=document.querySelector(`.search`),t=document.querySelector(`.search-icon`),n=document.querySelector(`.search-input`);if(!e||!t||!n)return;let r=!1,i=()=>{r=!0,e.classList.add(`is-open`),t.setAttribute(`aria-expanded`,`true`),n.focus()},a=()=>{n.value&&(n.value=``,B(``)),r=!1,e.classList.remove(`is-open`),t.setAttribute(`aria-expanded`,`false`),n.blur()};t.addEventListener(`click`,()=>r?a():i()),n.addEventListener(`input`,()=>{B(n.value),n.value&&!r&&i()}),n.addEventListener(`keydown`,e=>{e.key===`Escape`&&(a(),t.focus())})}var Ct=90;function wt(){let e=document.querySelectorAll(`.nav-item`),t=document.querySelectorAll(`.page`);if(e.length===0||e.length!==t.length)return;document.documentElement.style.setProperty(`--reveal-step`,`${Ct}ms`);function n(t){for(let n of e)n.setAttribute(`aria-selected`,String(n.dataset.tab===t))}function r(e){for(let n of t){let t=n===e;n.setAttribute(`aria-hidden`,String(!t)),n.removeAttribute(`data-reveal`)}e.setAttribute(`aria-hidden`,`false`),e.querySelectorAll(`:scope > *`).forEach((e,t)=>{e.style.setProperty(`--reveal-index`,String(t))})}function i(){let e=document.querySelector(`.page[aria-hidden="false"]`);e&&requestAnimationFrame(()=>{requestAnimationFrame(()=>e.setAttribute(`data-reveal`,`on`))})}function a(e){let t=document.querySelector(`.page[data-page="${e}"]`);t&&(n(e),r(t),i(),e===`profile`?bt():e===`cart`?we():e===`home`&&Ye())}for(let t of e)t.addEventListener(`click`,()=>{let e=t.dataset.tab;e&&a(e)});a(`home`)}function Tt(){St(),Xe(),Te(),wt(),xt(),pe()}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,Tt,{once:!0}):Tt();