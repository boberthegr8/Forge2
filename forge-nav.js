/* Forge Suite sidebar — the ONE sidebar every Forge app shows.
   Single source of truth: https://app.forgehub.dev/forge-nav.js
   Apps load it with: <script src="https://app.forgehub.dev/forge-nav.js" defer></script>
   To add/rename/reorder a page, edit ITEMS below and redeploy the hub only. */
(() => {
  if (window.__forgeNav) return;
  window.__forgeNav = true;
  // Never draw inside an embedded frame (e.g. Frame inside Scope, session iframe).
  try { if (window.top !== window.self) return; } catch { return; }

  const HUB = 'https://app.forgehub.dev';
  const CRM = 'https://crm.forgehub.dev';
  const LEGACY_SECTIONS = [
    { label: 'Command', items: [
      { id: 'home', b: 'HM', t: 'Home', h: HUB + '/' },
    ]},
    { label: 'Forge Suite', items: [
      { id: 'crm', b: 'CR', t: 'CRM', h: CRM + '/#/' },
      { id: 'reader', b: 'RD', t: 'Reader', h: 'https://reader.forgehub.dev/' },
      { id: 'scope', b: 'SC', t: 'Scope', h: 'https://scope.forgehub.dev/' },
      { id: 'quote', b: 'QT', t: 'Quote / AI Quoter', h: 'https://quote.forgehub.dev/' },
      { id: 'purchasing', b: 'PO', t: 'Purchasing', h: CRM + '/#/purchasing' },
      { id: 'delivery', b: 'OP', t: 'Operations · Delivery', h: CRM + '/#/deliveries' },
      { id: 'mfg', b: 'MF', t: 'Manufacturing', h: 'https://manufacturing.forgehub.dev/' },
      { id: 'portal', b: 'PT', t: 'Portal', h: 'https://portal.forgehub.dev/' },
      { id: 'frame', b: 'FR', t: 'Frame · 3D Takeoff', h: 'https://frame.forgehub.dev/' },
      { id: 'todo', b: 'TD', t: 'To Do', h: 'https://todo.forgehub.dev/' },
      { id: 'hermes', b: 'AI', t: 'Hermes', h: 'https://ai.forgehub.dev/sessions' },
    ]},
    { label: 'CRM', items: [
      { id: 'crm-dash', b: 'DB', t: 'Dashboard', h: CRM + '/#/' },
      { id: 'crm-contacts', b: 'CT', t: 'Contacts', h: CRM + '/#/crm' },
      { id: 'crm-quotes', b: 'QU', t: 'Quotes', h: CRM + '/#/quotes' },
      { id: 'crm-projects', b: 'PJ', t: 'Pipeline / Projects', h: CRM + '/#/projects' },
    ]},
  ];

  // Keep legacy destinations (including Manufacturing) available for rollback,
  // but only expose the consolidated hierarchy below.
  const legacy = Object.fromEntries(LEGACY_SECTIONS.flatMap(s => s.items).map(i => [i.id, i]));
  const item = (id, title, children) => ({ ...legacy[id], t: title || legacy[id].t, children });
  const ITEMS = [
    item('home', 'Home', [{ id:'analytics', b:'AN', t:'Analytics', h:HUB+'/#analytics' }]),
    item('crm', 'CRM', ['crm-contacts','crm-quotes','crm-projects','purchasing'].map(id => item(id))),
    item('scope', 'Estimating', [
      { id:'ai-takeoff', b:'AT', t:'AI Takeoff · 3D', h:'https://scope.forgehub.dev/' },
      { id:'jobs', b:'JB', t:'Jobs & 3D models', h:'https://scope.forgehub.dev/job.html' },
      item('reader'), item('quote','AI Quoter'), item('frame','Frame')]),
    item('delivery', 'Deliveries'), item('todo'), item('hermes', 'AI'),
    { id:'admin', b:'AD', t:'Admin', h:HUB+'/admin.html', ownerOnly:true },
    { id:'settings', b:'ST', t:'Settings', h:HUB+'/account.html', children:[item('portal','Customer Portal')] },
  ];

  // Per-app: hide that app's old suite navigation so only this sidebar remains.
  // App-specific tools (Scope job types, Portal project list, Mfg work orders) stay.
  const HIDE = {
    'https://crm.forgehub.dev': 'aside.forge-sidebar{display:none!important}',
    'https://reader.forgehub.dev': '.reader-sidebar{display:none!important}.reader-app{grid-template-columns:minmax(0,1fr)!important}',
    'https://quote.forgehub.dev': '.quoter-sidebar .suite-nav,.quoter-sidebar .brand-block{display:none!important}',
    'https://manufacturing.forgehub.dev': '.mfg-sidebar .mfg-brand,.mfg-sidebar nav>.nav-label:first-child,.mfg-sidebar nav>a.suite-link,.mfg-sidebar nav>div.suite-link,.mfg-sidebar nav>.nav-separator{display:none!important}',
    'https://portal.forgehub.dev': '.portal-brand{display:none!important}',
    'https://scope.forgehub.dev': '#forge-suite-nav{display:none!important}',
    'https://app.forgehub.dev': '',
    'https://frame.forgehub.dev': '',
    'https://todo.forgehub.dev': '',
  };

  function activeId() {
    const o = location.origin, hash = (location.hash || '#/').replace(/^#/, '').split('?')[0];
    if (o === HUB) {
      if (location.pathname === '/admin.html') return 'admin';
      if (location.pathname === '/account.html') return 'settings';
      return location.hash === '#analytics' ? 'analytics' : 'home';
    }
    if (o === CRM) {
      return ({ '/': 'crm', '': 'crm', '/crm': 'crm-contacts', '/quotes': 'crm-quotes',
        '/projects': 'crm-projects', '/purchasing': 'purchasing', '/deliveries': 'delivery',
      })[hash] || 'crm';
    }
    for (const i of ITEMS.flatMap(i => [i, ...(i.children || [])])) {
      try { if (new URL(i.h).origin === o && !i.h.startsWith(CRM)) return i.id; } catch {}
    }
    return '';
  }

  const W = 248;
  const css = `
  #forge-nav{position:fixed;inset:0 auto 0 0;width:${W}px;z-index:40;background:#111;border-right:1px solid #2a2a2a;
    display:flex;flex-direction:column;gap:14px;padding:18px 14px;overflow-y:auto;box-sizing:border-box;
    font-family:Inter,'Segoe UI',system-ui,-apple-system,sans-serif;color:#f4f4f4;-webkit-font-smoothing:antialiased}
  #forge-nav *{box-sizing:border-box}
  #forge-nav .fn-brand{display:flex;align-items:center;gap:12px;padding:2px 6px 8px;text-decoration:none;color:inherit}
  #forge-nav .fn-mark{width:40px;height:40px;border-radius:12px;background:#ff7716;color:#111;display:grid;place-items:center;
    font-weight:1000;font-size:18px;box-shadow:0 10px 28px rgba(255,119,22,.18)}
  #forge-nav .fn-brand b{display:block;font-size:18px;line-height:1;font-weight:950;letter-spacing:-.02em}
  #forge-nav .fn-brand small{display:block;color:#9aa0a6;margin-top:5px;font-size:9px;text-transform:uppercase;letter-spacing:.2em;font-weight:900}
  #forge-nav .fn-label{padding:6px 10px 2px;color:#686e75;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.18em}
  #forge-nav .fn-list{display:grid;gap:3px}
  #forge-nav summary{cursor:pointer;margin:2px 10px 8px 49px;font-size:10px;color:#9aa0a6}
  #forge-nav .fn-children{margin:0 0 8px 18px;border-left:1px solid #303030;padding-left:5px}
  #forge-nav a:focus-visible,#forge-nav summary:focus-visible{outline:2px solid #ff7716;outline-offset:2px}
  #forge-nav a.fn-item{display:flex;align-items:center;gap:11px;text-decoration:none;color:#c9cdd1;padding:8px 10px;
    border:1px solid transparent;border-radius:10px;font-size:13px;font-weight:750;line-height:1.2;transition:.15s ease}
  #forge-nav a.fn-item:hover{background:#191919;border-color:#242424;color:#fff}
  #forge-nav a.fn-item.active{background:#1a1a1a;border-color:#2d2d2d;color:#fff;box-shadow:inset 3px 0 0 #ff7716}
  #forge-nav .fn-ico{width:28px;height:28px;flex:0 0 28px;border-radius:8px;border:1px solid #303030;background:#181818;
    display:grid;place-items:center;color:#9aa0a6;font-size:9px;font-weight:1000;letter-spacing:.02em}
  #forge-nav a.fn-item.active .fn-ico{color:#111;background:#ff7716;border-color:#ff7716}
  #forge-nav .fn-foot{margin-top:auto;border:1px solid #2a2a2a;background:#151515;padding:11px 12px;border-radius:12px;
    display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px}
  #forge-nav .fn-foot span{color:#9aa0a6}
  #forge-nav .fn-foot i{display:inline-block;width:7px;height:7px;background:#43c17b;border-radius:99px;margin-right:6px}
  #forge-nav .fn-foot a{color:#ff7716;text-decoration:none;font-weight:850}
  html.forge-nav-on body{padding-left:${W}px!important;box-sizing:border-box}
  #forge-nav-toggle{display:none}
  @media(max-width:860px){
    html.forge-nav-on body{padding-left:0!important}
    #forge-nav{transform:translateX(-100%);transition:transform .2s ease;box-shadow:0 0 60px rgba(0,0,0,.6);z-index:2147483000}
    html.forge-nav-open #forge-nav{transform:none}
    #forge-nav-toggle{display:grid;place-items:center;position:fixed;left:12px;bottom:12px;z-index:2147483001;width:46px;height:46px;
      border-radius:14px;border:1px solid #303030;background:#ff7716;color:#111;font:1000 18px/1 Inter,system-ui,sans-serif;
      box-shadow:0 10px 28px rgba(0,0,0,.45);cursor:pointer}
  }`;

  function esc(v) { return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  let isOwner = false;
  function render() {
    const active = activeId();
    const link = i => `<a class="fn-item${i.id === active ? ' active' : ''}" data-id="${i.id}" href="${i.h}"${i.id === active ? ' aria-current="page"' : ''}><span class="fn-ico">${i.b}</span>${esc(i.t)}</a>`;
    return `<a class="fn-brand" href="${HUB}/" title="Forge Home"><div class="fn-mark">F</div><div><b>FORGE</b><small>Operating System</small></div></a>` +
      `<div class="fn-list">` + ITEMS.filter(i => !i.ownerOnly || isOwner).map(i => `<div data-main="${i.id}">${link(i)}` +
        (i.children ? `<details${i.children.some(c => c.id === active) ? ' open' : ''}><summary>${esc(i.t)} pages</summary><div class="fn-children">${i.children.map(link).join('')}</div></details>` : '') + `</div>`).join('') + `</div>` +
      `<div class="fn-foot"><span>Forge account</span><a href="${HUB}/account.html?signout=1">Sign out</a></div>`;
  }

  function mount() {
    if (document.getElementById('forge-nav')) return;
    const style = document.createElement('style');
    style.id = 'forge-nav-style';
    style.textContent = css + (HIDE[location.origin] || '');
    document.head.appendChild(style);
    const nav = document.createElement('nav');
    nav.id = 'forge-nav';
    nav.setAttribute('aria-label', 'Forge Suite');
    nav.innerHTML = render();
    document.body.appendChild(nav);
    // UI convenience only: admin.html retains its server-side owner/MFA checks.
    // Never initialize a second auth client on another app's origin.
    if (location.origin === HUB) {
      import('./core-client.js').then(({ core }) => {
        let generation = 0;
        const update = value => {
          isOwner = value;
          nav.innerHTML = render();
          const card = document.getElementById('adminModule');
          if (card) card.hidden = !isOwner;
        };
        const refresh = async ticket => {
          try {
            const { data, error } = await core.rpc('forge_account_context');
            if (ticket === generation) update(!error && data?.is_owner === true);
          } catch { if (ticket === generation) update(false); }
        };
        core.auth.onAuthStateChange(event => {
          const ticket = ++generation;
          update(false);
          // Do not await Supabase operations inside an auth callback.
          if (event !== 'SIGNED_OUT') setTimeout(() => void refresh(ticket), 0);
        });
        void refresh(generation);
      }).catch(() => { /* Unknown context stays fail-closed. */ });
    }
    const toggle = document.createElement('button');
    toggle.id = 'forge-nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open Forge menu');
    toggle.textContent = 'F';
    toggle.setAttribute('aria-controls', 'forge-nav');
    toggle.setAttribute('aria-expanded', 'false');
    const setOpen = open => {
      document.documentElement.classList[open ? 'add' : 'remove']('forge-nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close Forge menu' : 'Open Forge menu');
    };
    toggle.onclick = () => setOpen(!document.documentElement.classList.contains('forge-nav-open'));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    document.body.appendChild(toggle);
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.documentElement.classList.add('forge-nav-on');
    window.addEventListener('hashchange', () => {
      nav.innerHTML = render();
    });
  }

  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();