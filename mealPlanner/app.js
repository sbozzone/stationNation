// ═══════════════════════════════════════════════════════════════
// Family Dinner Time — Main App
// ═══════════════════════════════════════════════════════════════

import * as DB from './db.js';
import { CLAUDE_API_KEY } from './config.js';

// ─── Constants ─────────────────────────────────────────────────

const TAGS = [
  { id: 'quick',       label: 'Quick',        emoji: '⚡', rgb: '196,82,66'   },
  { id: 'slow-cooker', label: 'Slow Cooker',   emoji: '🥘', rgb: '139,105,20'  },
  { id: 'instant-pot', label: 'Instant Pot',   emoji: '⚡', rgb: '74,127,165'  },
  { id: 'vegetarian',  label: 'Vegetarian',    emoji: '🥦', rgb: '107,155,74'  },
  { id: 'vegan',       label: 'Vegan',         emoji: '🌱', rgb: '74,155,111'  },
  { id: 'kid-friendly',label: 'Kid-Friendly',  emoji: '👧', rgb: '196,154,42'  },
  { id: 'date-night',  label: 'Date Night',    emoji: '🕯️', rgb: '155,74,127' },
  { id: 'comfort-food',label: 'Comfort Food',  emoji: '🍲', rgb: '196,154,42'  },
  { id: 'healthy',     label: 'Healthy',       emoji: '💚', rgb: '74,155,111'  },
  { id: 'leftovers',   label: 'Leftovers OK',  emoji: '♻️', rgb: '74,155,111' },
  { id: 'one-pot',     label: 'One Pot',       emoji: '🫕', rgb: '74,127,165'  },
  { id: 'grilling',    label: 'Grilling',      emoji: '🔥', rgb: '196,82,66'   },
  { id: 'seafood',     label: 'Seafood',       emoji: '🐟', rgb: '74,127,165'  },
  { id: 'pasta',       label: 'Pasta',         emoji: '🍝', rgb: '217,119,87'  },
  { id: 'soup',        label: 'Soup',          emoji: '🍲', rgb: '74,127,165'  },
  { id: 'beef',        label: 'Beef',          emoji: '🥩', rgb: '196,82,66'   },
  { id: 'chicken',     label: 'Chicken',       emoji: '🍗', rgb: '196,154,42'  },
  { id: 'pork',        label: 'Pork',          emoji: '🐷', rgb: '217,119,87'  },
];

const APPLIANCES = [
  { id: 'air-fryer',       label: 'Air Fryer',       emoji: '🌀' },
  { id: 'crockpot',        label: 'Crockpot',         emoji: '🥘' },
  { id: 'instant-pot',     label: 'Instant Pot',      emoji: '🫙' },
  { id: 'grill',           label: 'Grill',            emoji: '🔥' },
  { id: 'oven',            label: 'Oven',             emoji: '🍳' },
  { id: 'stovetop',        label: 'Stovetop',         emoji: '🍲' },
  { id: 'microwave',       label: 'Microwave',        emoji: '📡' },
  { id: 'food-processor',  label: 'Food Processor',   emoji: '🔪' },
  { id: 'stand-mixer',     label: 'Stand Mixer',      emoji: '🧁' },
];

const ING_CATEGORIES = [
  'Produce','Meat & Seafood','Dairy & Eggs','Bakery',
  'Frozen','Pantry','Canned Goods','Condiments','Snacks','Beverages','Other'
];

const PANTRY_GROUPS = ['Produce','Meat','Dairy','Pantry','Frozen','Beverages','Bakery','Other'];

const IMPACT_TYPES = [
  { id: 'away',   icon: '🏃', label: 'Away',        desc: "Won't be home" },
  { id: 'quick',  icon: '⚡', label: 'Short on Time', desc: 'Need a fast meal' },
  { id: 'late',   icon: '🌙', label: 'Late Night',   desc: 'Dinner will be late' },
  { id: 'custom', icon: '📝', label: 'Custom',       desc: 'Just a note' },
];

const ICONS = {
  home:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12L12 3l9 9"/><path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"/></svg>`,
  calendar:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  fork:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M12 12L8 7M12 12l4-5M8 2v5l1 5M16 2v5l-1 5"/></svg>`,
  cart:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  box:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  settings:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  printer:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  search:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  pencil:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
  plus:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  minus:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  x:           `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevLeft:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevRight:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"/></svg>`,
  chevDown:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="6 9 12 15 18 9"/></svg>`,
  chevUp:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="18 15 12 9 6 15"/></svg>`,
  sparkles:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M5 3l.5 2 2 .5-2 .5L5 8l-.5-2L2.5 5.5l2-.5L5 3z"/><path d="M19 14l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z"/></svg>`,
  thumbsUp:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>`,
  thumbsDown:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>`,
  check:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  heart:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
  copy:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
  share:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  link:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`,
  grid:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
};

// ─── State ─────────────────────────────────────────────────────

const S = {
  family:    null,
  dishes:    [],
  pantry:    [],
  shopping:  [],
  mealPlan:  {},     // { [dateStr]: { id, dishes: [{dish_id, votes, side_dishes}] } }
  activities:{},     // { [dateStr]: [{id, text, impact_type}] }
  templates: [],
  page:      'plan',
  weekStart: null,   // Date
  weekMode:  '7day', // '7day' | 'mon-sun'
  loading:   false,
  sheet:     null,
  sheetData: {},
  dishFilter: { search: '', tags: [] },
  pantryFilter: { search: '', inStockOnly: false },
  pantryOpen: {},    // { [groupName]: true/false }
  templateTab: 'load',
  suggestions: null, // null | 'loading' | [{name, rationale, isInLibrary, dish?}]
  onboardError: '',
};

// ─── Utilities ─────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function parseLocalDate(str) {
  const [y,m,d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON_NAMES  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekStart() {
  if (S.weekMode === '7day') return today();
  const t = today();
  const dow = t.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(t, diff);
}

function getWeekDays() {
  const start = S.weekStart || today();
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function fmtWeekRange() {
  const days = getWeekDays();
  const a = days[0], b = days[6];
  if (a.getMonth() === b.getMonth())
    return `${MON_NAMES[a.getMonth()]} ${a.getDate()}–${b.getDate()}`;
  return `${MON_NAMES[a.getMonth()]} ${a.getDate()} – ${MON_NAMES[b.getMonth()]} ${b.getDate()}`;
}

function tagById(id) { return TAGS.find(t => t.id === id); }

function tagPillHtml(tagId, label) {
  const t = tagById(tagId);
  if (!t && !label) return '';
  const rgb = t?.rgb || '122,111,94';
  const text = label || t?.label || tagId;
  const emoji = t?.emoji || '';
  return `<span class="tag-pill" style="background:rgba(${rgb},0.1);color:rgb(${rgb})">${emoji} ${esc(text)}</span>`;
}

function impactIcon(type) {
  return IMPACT_TYPES.find(i => i.id === type)?.icon || '📝';
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function shareUrl() {
  const base = `${location.origin}${location.pathname}`;
  return `${base}?code=${S.family?.code}`;
}

// ─── Data Loading ───────────────────────────────────────────────

async function loadFamily(code) {
  S.loading = true;
  renderApp();
  try {
    const fam = await DB.getFamilyByCode(code.trim());
    if (!fam) { S.onboardError = 'Family not found. Check the code.'; S.family = null; S.loading = false; renderApp(); return; }
    S.family = fam;
    localStorage.setItem('fdt_code', fam.code);
    await loadAll();
    S.page = 'plan';
  } catch(e) {
    S.onboardError = `Connection error: ${e.message}`;
    S.family = null;
  }
  S.loading = false;
  renderApp();
}

async function loadAll() {
  S.weekStart = getWeekStart();
  const [dishes, pantry, shopping, templates] = await Promise.all([
    DB.getDishes(S.family.id),
    DB.getPantry(S.family.id),
    DB.getShopping(S.family.id),
    DB.getTemplates(S.family.id),
  ]);
  S.dishes    = dishes;
  S.pantry    = pantry;
  S.shopping  = shopping;
  S.templates = templates;
  // default all pantry groups open
  PANTRY_GROUPS.forEach(g => { if (S.pantryOpen[g] === undefined) S.pantryOpen[g] = true; });
  await loadWeekData();
}

async function loadWeekData() {
  const days  = getWeekDays();
  const start = fmtDate(days[0]);
  const end   = fmtDate(days[6]);
  const [planDays, acts] = await Promise.all([
    DB.getMealPlanRange(S.family.id, start, end),
    DB.getActivitiesRange(S.family.id, start, end),
  ]);
  S.mealPlan  = {};
  S.activities = {};
  for (const d of planDays) S.mealPlan[d.date] = d;
  for (const a of acts) {
    if (!S.activities[a.date]) S.activities[a.date] = [];
    S.activities[a.date].push(a);
  }
}

// ─── Router ────────────────────────────────────────────────────

async function navigate(page) {
  if (page === 'home') { showSplash(); return; }
  S.page = page;
  renderApp();
}

function renderApp() {
  const pg = document.getElementById('page');
  const nav = document.getElementById('nav');

  if (S.loading) {
    pg.innerHTML = `<div class="loading-center"><div class="spinner"></div><span>Loading…</span></div>`;
    nav.innerHTML = '';
    return;
  }

  if (!S.family) {
    pg.innerHTML = renderOnboarding();
    pg.style.paddingBottom = '24px';
    nav.innerHTML = '';
    return;
  }
  pg.style.paddingBottom = '';

  const pages = { plan: planPage, dishes: dishesPage, shopping: shoppingPage, pantry: pantryPage, settings: settingsPage };
  pg.innerHTML = `<div class="fade-in">${(pages[S.page] || planPage)()}</div>`;
  nav.innerHTML = renderNav();
}

function renderNav() {
  const tabs = [
    { id: 'home',     icon: ICONS.home,     label: 'Home'   },
    { id: 'plan',     icon: ICONS.calendar, label: 'Plan'   },
    { id: 'dishes',   icon: ICONS.fork,     label: 'Dishes' },
    { id: 'shopping', icon: ICONS.cart,     label: 'Shop'   },
    { id: 'pantry',   icon: ICONS.box,      label: 'Pantry' },
  ];
  return tabs.map(t =>
    `<button class="nav-tab ${S.page === t.id ? 'active' : ''}" data-action="nav" data-page="${t.id}" aria-label="${t.label}">
      ${t.icon}<span>${t.label}</span>
    </button>`
  ).join('');
}

// ─── Plan Page ──────────────────────────────────────────────────

function planPage() {
  const days = getWeekDays();
  const todayStr = fmtDate(today());
  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title">${esc(S.family.name)}</div>
        <div class="page-subtitle">Week of ${fmtWeekRange()}</div>
      </div>
      <div class="page-header-actions">
        <button class="icon-btn" onclick="window.print()" aria-label="Print">${ICONS.printer}</button>
        <button class="icon-btn" data-action="nav" data-page="settings" aria-label="Settings">${ICONS.settings}</button>
      </div>
    </div>

    <div class="week-controls">
      <button class="icon-btn" data-action="prev-week" aria-label="Previous week">${ICONS.chevLeft}</button>
      <span class="week-label">${fmtWeekRange()}</span>
      <button class="icon-btn" data-action="next-week" aria-label="Next week">${ICONS.chevRight}</button>
      <div class="week-mode-toggle">
        <button class="chip ${S.weekMode==='7day'?'active':''}" data-action="week-mode" data-mode="7day" aria-label="Rolling 7-day view">7-day</button>
        <button class="chip ${S.weekMode==='mon-sun'?'active':''}" data-action="week-mode" data-mode="mon-sun" aria-label="Monday–Sunday view">Mon–Sun</button>
      </div>
      <button class="link-btn muted" data-action="clear-week" style="margin-left:auto">↺ Clear</button>
    </div>

    <button class="templates-btn" data-action="open-sheet" data-sheet="templates">
      ${ICONS.grid} Meal Templates
    </button>

    <div class="days-list">
      ${days.map(d => dayCard(d, todayStr)).join('')}
    </div>
  `;
}

function dayCard(date, todayStr) {
  const ds = fmtDate(date);
  const isToday = ds === todayStr;
  const dayName = DAY_NAMES[date.getDay()];
  const dayNum  = date.getDate();
  const plan = S.mealPlan[ds];
  const dishesList = plan?.dishes || [];
  const acts  = S.activities[ds] || [];

  const dishRows = dishesList.map(entry => {
    const d = S.dishes.find(x => x.id === entry.dish_id);
    if (!d) return '';
    const tagIcons = (d.tags || []).slice(0,4).map(t => {
      const tag = tagById(t);
      return tag ? `<span class="dish-tag-icon" title="${esc(tag.label)}">${tag.emoji}</span>` : '';
    }).join('');
    const upVotes = (entry.votes?.up || []).length;
    const dnVotes = (entry.votes?.down || []).length;
    const isSide  = entry.is_side || false;
    return `
      <div class="dish-row">
        <div class="dish-row-main">
          <div class="dish-row-name">
            ${d.is_memory_meal ? '❤️ ' : ''}${esc(d.name)}
            ${isSide ? '<span style="font-size:11px;color:var(--text-tertiary);font-weight:400"> · side</span>' : ''}
          </div>
          <div class="dish-row-meta">
            <div class="dish-votes">
              <button class="vote-btn" data-action="vote" data-date="${ds}" data-dish="${d.id}" data-type="up" aria-label="Thumbs up">
                ${ICONS.thumbsUp} ${upVotes || ''}
              </button>
              <button class="vote-btn" data-action="vote" data-date="${ds}" data-dish="${d.id}" data-type="down" aria-label="Thumbs down">
                ${ICONS.thumbsDown} ${dnVotes || ''}
              </button>
            </div>
            <div class="dish-tag-icons">${tagIcons}</div>
          </div>
        </div>
        <button class="remove-dish-btn" data-action="remove-dish" data-date="${ds}" data-dish="${d.id}" aria-label="Remove dish">${ICONS.x}</button>
      </div>`;
  }).join('');

  const mainDishes = dishesList.filter(e => !e.is_side);
  const noMain = mainDishes.length === 0;

  const actPills = acts.map(a =>
    `<div class="activity-pill impact-${a.impact_type}">
      <span>${impactIcon(a.impact_type)}</span>
      <span class="activity-pill-text">${esc(a.text)}</span>
      <button class="activity-delete" data-action="del-activity" data-id="${a.id}" aria-label="Remove activity">&times;</button>
    </div>`
  ).join('');

  return `
    <div class="day-card ${isToday ? 'today' : ''}">
      <div class="day-card-head">
        <div class="day-name-block">
          <span class="day-name">${dayName}</span>
          <span class="day-num">${dayNum}</span>
        </div>
        ${isToday ? '<span class="today-badge">TODAY</span>' : ''}
      </div>
      <div class="day-card-body">
        ${dishRows}
        ${noMain
          ? `<button class="add-dinner-btn" data-action="pick-dish" data-date="${ds}" data-side="0">+ Add dinner</button>`
          : `<button class="add-side-btn" data-action="pick-dish" data-date="${ds}" data-side="1">+ Add side dish</button>`
        }
        <div class="activities-section">
          ${acts.length ? `<div class="activities-row">${actPills}</div>` : ''}
          <button class="add-activity-btn" data-action="open-activity" data-date="${ds}">+ Activity tonight</button>
        </div>
      </div>
    </div>`;
}

// ─── Dishes Page ────────────────────────────────────────────────

function dishesPage() {
  const { search, tags: filterTags } = S.dishFilter;
  let list = S.dishes;
  if (search) list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  if (filterTags.length) list = list.filter(d => filterTags.every(t => (d.tags||[]).includes(t) || (d.custom_tags||[]).includes(t)));

  const filterChips = [{ id: '__all', label: 'All', emoji: '' }, ...TAGS].map(t =>
    t.id === '__all'
      ? `<button class="chip ${filterTags.length===0?'active':''}" data-action="dish-filter-tag" data-tag="__all">All</button>`
      : `<button class="chip ${filterTags.includes(t.id)?'active':''}" data-action="dish-filter-tag" data-tag="${t.id}">${t.emoji} ${t.label}</button>`
  ).join('');

  const rows = list.map(d => {
    const tags = [...(d.tags||[]).map(t => tagPillHtml(t, null)), ...(d.custom_tags||[]).map(t => tagPillHtml(null, t))].join('');
    return `
      <div class="dish-list-row">
        <div class="dish-list-row-main">
          <div class="dish-list-name">${d.is_memory_meal ? '❤️ ' : ''}${esc(d.name)}</div>
          <div class="dish-list-tags">${tags}</div>
        </div>
        <div class="dish-list-actions">
          <button class="dish-action-btn" data-action="edit-dish" data-id="${d.id}" aria-label="Edit">${ICONS.pencil}</button>
          <button class="dish-action-btn danger" data-action="del-dish" data-id="${d.id}" aria-label="Delete">${ICONS.trash}</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">Favorite Dishes</div></div>
      <div class="page-header-actions">
        <button class="icon-btn" data-action="nav" data-page="settings" aria-label="Settings">${ICONS.settings}</button>
      </div>
    </div>
    <div class="section-pad mb-12">
      <div class="input-icon-wrap">
        ${ICONS.search.replace('<svg', '<svg class="input-icon"')}
        <input class="input" type="search" placeholder="Search dishes…" value="${esc(search)}" data-action="dish-search">
      </div>
    </div>
    <div class="chips-scroll mb-12">${filterChips}</div>
    <div class="section-pad mb-12" style="display:flex;gap:10px">
      <button class="btn btn-primary flex-1" data-action="add-dish">${ICONS.plus} Add Dish</button>
      <button class="btn btn-outline" data-action="open-sheet" data-sheet="import-url">${ICONS.link} Import URL</button>
    </div>
    ${list.length
      ? `<div class="dish-list">${rows}</div>`
      : `<div class="empty-state">${ICONS.fork}<div class="empty-state-title">No dishes yet</div><div class="empty-state-sub">Add your family's favorites</div></div>`
    }
  `;
}

// ─── Shopping Page ──────────────────────────────────────────────

function shoppingPage() {
  const unchecked = S.shopping.filter(i => !i.checked_off);
  const checked   = S.shopping.filter(i => i.checked_off);

  const itemHtml = (item) => {
    const meta = [item.qty, item.unit, item.category].filter(Boolean).join(' ');
    return `
      <div class="shopping-item ${item.checked_off ? 'checked' : ''}">
        <div class="shopping-item-check ${item.checked_off ? 'checked' : ''}" data-action="toggle-shopping" data-id="${item.id}" data-checked="${item.checked_off ? '0' : '1'}">
          ${item.checked_off ? ICONS.check : ''}
        </div>
        <div class="shopping-item-main">
          <div class="shopping-item-name">${esc(item.name)}</div>
          ${meta ? `<div class="shopping-item-meta">${esc(meta)}</div>` : ''}
        </div>
        <button class="shopping-delete-btn" data-action="del-shopping" data-id="${item.id}" aria-label="Delete">${ICONS.trash}</button>
      </div>`;
  };

  return `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">Shopping List</div></div>
      <div class="page-header-actions">
        ${checked.length ? `<button class="link-btn muted" data-action="clear-checked" style="font-size:13px">Clear checked</button>` : ''}
        <button class="icon-btn" data-action="nav" data-page="settings" aria-label="Settings">${ICONS.settings}</button>
      </div>
    </div>
    <div class="shopping-add-row">
      <input class="input" type="text" id="shop-input" placeholder="Add item…">
      <button class="btn btn-primary" data-action="add-shopping-manual" style="white-space:nowrap">+ Add</button>
    </div>
    <div class="section-pad mb-12">
      <button class="btn btn-outline btn-full" data-action="generate-shopping">${ICONS.sparkles} Generate from This Week</button>
    </div>
    ${S.shopping.length === 0
      ? `<div class="empty-state">${ICONS.cart}<div class="empty-state-title">No items yet</div><div class="empty-state-sub">Add ingredients as you plan meals!</div></div>`
      : `<div class="shopping-list">
          ${unchecked.map(itemHtml).join('')}
          ${checked.length ? `<div class="checked-section-label">CHECKED OFF (${checked.length})</div>${checked.map(itemHtml).join('')}` : ''}
        </div>`
    }
  `;
}

// ─── Pantry Page ────────────────────────────────────────────────

function pantryPage() {
  const { search, inStockOnly } = S.pantryFilter;
  let items = S.pantry;
  if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  if (inStockOnly) items = items.filter(i => (parseFloat(i.qty) || 0) > 0);

  const groupMap = {
    'Produce': 'Produce',
    'Meat & Seafood': 'Meat', 'Meat': 'Meat',
    'Dairy & Eggs': 'Dairy', 'Dairy': 'Dairy',
    'Pantry': 'Pantry', 'Canned Goods': 'Pantry', 'Condiments': 'Pantry', 'Snacks': 'Pantry',
    'Frozen': 'Frozen',
    'Beverages': 'Beverages',
    'Bakery': 'Bakery',
    'Other': 'Other',
  };

  const grouped = {};
  PANTRY_GROUPS.forEach(g => grouped[g] = []);
  items.forEach(i => {
    const g = groupMap[i.category] || 'Other';
    grouped[g].push(i);
  });

  const sections = PANTRY_GROUPS.filter(g => grouped[g].length > 0 || !inStockOnly).map(g => {
    const list = grouped[g];
    if (list.length === 0) return '';
    const isOpen = S.pantryOpen[g] !== false;
    const rows = list.map(item => {
      const qty = parseFloat(item.qty) || 0;
      const isLow = item.low_stock_alert_at && qty <= item.low_stock_alert_at;
      return `
        <div class="pantry-item">
          <span class="pantry-item-name ${isLow ? 'low-stock' : ''}">${esc(item.name)}${isLow ? ' ⚠️' : ''}</span>
          <div class="qty-stepper">
            <button class="qty-btn" data-action="pantry-qty" data-id="${item.id}" data-delta="-1" aria-label="Decrease">${ICONS.minus}</button>
            <span class="qty-value font-mono">${qty % 1 === 0 ? qty : qty.toFixed(1)}</span>
            ${item.unit ? `<span class="qty-unit">${esc(item.unit)}</span>` : ''}
            <button class="qty-btn" data-action="pantry-qty" data-id="${item.id}" data-delta="1" aria-label="Increase">${ICONS.plus}</button>
          </div>
          <div class="pantry-item-actions">
            <button class="dish-action-btn" data-action="edit-pantry" data-id="${item.id}" aria-label="Edit">${ICONS.pencil}</button>
            <button class="dish-action-btn danger" data-action="del-pantry" data-id="${item.id}" aria-label="Delete">${ICONS.trash}</button>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="pantry-section ${isOpen ? 'open' : ''}" data-group="${g}">
        <div class="pantry-section-head" data-action="toggle-pantry-group" data-group="${g}">
          <span class="pantry-section-chevron">${ICONS.chevDown}</span>
          <span class="pantry-section-name">${g}</span>
          <span class="pantry-section-count">${list.length}</span>
        </div>
        <div class="pantry-section-body">${rows}</div>
      </div>`;
  }).join('');

  const allOpen = PANTRY_GROUPS.every(g => S.pantryOpen[g] !== false);

  return `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">Pantry</div></div>
      <div class="page-header-actions">
        <button class="icon-btn" data-action="nav" data-page="settings" aria-label="Settings">${ICONS.settings}</button>
      </div>
    </div>
    <div class="section-pad mb-12">
      <button class="btn btn-primary btn-full" data-action="add-pantry">${ICONS.plus} Add Item</button>
    </div>
    <div class="section-pad mb-12">
      <div class="input-icon-wrap">
        ${ICONS.search.replace('<svg', '<svg class="input-icon"')}
        <input class="input" type="search" placeholder="Search pantry…" value="${esc(search)}" data-action="pantry-search">
      </div>
    </div>
    <div class="pantry-controls section-pad mb-12">
      <button class="chip ${inStockOnly ? 'active' : ''}" data-action="pantry-instock">In stock only</button>
      <div class="pantry-expand-links">
        <button class="link-btn ${allOpen?'':'muted'}" data-action="pantry-expand-all">Expand all</button>
        <button class="link-btn ${!allOpen?'':'muted'}" data-action="pantry-collapse-all">Collapse all</button>
      </div>
    </div>
    <div class="pantry-accordion">${sections || '<div class="empty-state">No items found</div>'}</div>
    <div style="height:16px"></div>
  `;
}

// ─── Settings Page ──────────────────────────────────────────────

function settingsPage() {
  const url = shareUrl();
  return `
    <div class="page-header">
      <div class="page-header-left"><div class="page-title">Settings</div></div>
      <div class="page-header-actions">${ICONS.settings}</div>
    </div>

    <div class="settings-card">
      <div class="settings-family-name">${esc(S.family.name)}</div>
      <div class="text-muted" style="font-size:14px">Share this link so family members can join your meal plan.</div>

      <div class="settings-label">Share Link</div>
      <div class="settings-url-row">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(url)}</span>
        <button data-action="copy-url" aria-label="Copy link">${ICONS.copy}</button>
      </div>

      <div class="settings-label">Family Code</div>
      <div class="settings-code">${esc(S.family.code)}</div>

      <div style="margin-top:20px">
        <button class="btn btn-primary btn-full" data-action="share-family">${ICONS.share} Share with Family</button>
      </div>
    </div>

    <div class="settings-card" style="margin-top:12px">
      <button class="btn btn-danger btn-full" data-action="leave-family">↪ Leave Family</button>
    </div>
    <div style="height:16px"></div>
  `;
}

// ─── Onboarding ─────────────────────────────────────────────────

function renderOnboarding() {
  return `
    <div class="onboarding">
      <div>
        <div class="onboarding-logo">🍽 Family Dinner Time</div>
        <div class="onboarding-sub">Smart Planning. Happier Families. Better Dinners.</div>
      </div>
      ${S.onboardError ? `<div class="error-msg">${esc(S.onboardError)}</div>` : ''}
      <div class="onboarding-card">
        <div class="field"><label>Join with a Family Code</label>
          <input class="input" id="ob-code" type="text" placeholder="e.g. BzFx7kRa" maxlength="12">
        </div>
        <button class="btn btn-primary btn-full" data-action="join-family">Join Family</button>
      </div>
      <div class="onboarding-divider">or</div>
      <div class="onboarding-card">
        <div class="field"><label>Create a New Family</label>
          <input class="input" id="ob-name" type="text" placeholder="e.g. The Bozzones" maxlength="40">
        </div>
        <button class="btn btn-outline btn-full" data-action="create-family">Create Family</button>
      </div>
    </div>`;
}

// ─── Splash ─────────────────────────────────────────────────────

function showSplash() {
  const el = document.getElementById('splash');
  el.classList.add('visible');
}
function hideSplash() {
  const el = document.getElementById('splash');
  el.classList.remove('visible');
}

// ─── Sheets ─────────────────────────────────────────────────────

function openSheet(name, data = {}) {
  S.sheet = name;
  S.sheetData = data;
  renderSheet();
}

function closeSheet() {
  S.sheet = null;
  S.sheetData = {};
  S.suggestions = null;
  document.getElementById('sheet-overlay').classList.remove('visible');
  document.getElementById('sheet-panel').classList.remove('visible');
}

function renderSheet() {
  const overlay = document.getElementById('sheet-overlay');
  const panel   = document.getElementById('sheet-panel');
  if (!S.sheet) { closeSheet(); return; }

  const renderers = {
    'pick-dish':    pickDishSheet,
    'add-dish':     addEditDishSheet,
    'edit-dish':    addEditDishSheet,
    'add-pantry':   addEditPantrySheet,
    'edit-pantry':  addEditPantrySheet,
    'activity':     activitySheet,
    'suggestions':  suggestionsSheet,
    'templates':    templatesSheet,
    'import-url':   importUrlSheet,
  };

  const html = renderers[S.sheet]?.() || '';
  panel.innerHTML = html;
  overlay.classList.add('visible');
  panel.classList.add('visible');

  // Focus first input
  setTimeout(() => panel.querySelector('input')?.focus(), 300);
}

// ── Pick Dish ──────────────────────────────────────────────────

function pickDishSheet() {
  const { date, isSide } = S.sheetData;
  const { search, tags } = S.dishFilter;

  // Pre-suggest quick dishes if there's a "quick" activity tonight
  const dateActs = S.activities[date] || [];
  const hasQuickAct = dateActs.some(a => a.impact_type === 'quick');
  const hasAwayAct  = dateActs.some(a => a.impact_type === 'away');

  const activityHint = hasAwayAct
    ? `<div style="background:rgba(196,82,66,0.1);color:rgb(196,82,66);border-radius:10px;padding:8px 12px;font-size:13px;margin-bottom:12px">🏃 You have an away activity tonight — you may not need dinner!</div>`
    : hasQuickAct
    ? `<div style="background:var(--brand-light);color:var(--brand);border-radius:10px;padding:8px 12px;font-size:13px;margin-bottom:12px">⚡ Short on time tonight — quick dishes shown first</div>`
    : '';

  let list = [...S.dishes];
  if (hasQuickAct) list.sort((a,b) => ((b.tags||[]).includes('quick')?1:0) - ((a.tags||[]).includes('quick')?1:0));

  if (search) list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  if (tags.length) list = list.filter(d => tags.some(t => (d.tags||[]).includes(t)));

  const filterChips = TAGS.map(t =>
    `<button class="chip ${tags.includes(t.id)?'active':''}" data-action="pick-filter" data-tag="${t.id}">${t.emoji} ${t.label}</button>`
  ).join('');

  const rows = list.map(d => {
    const tagPills = (d.tags||[]).slice(0,3).map(t => tagPillHtml(t, null)).join('');
    return `
      <div class="pick-dish-item" data-action="select-dish" data-id="${d.id}">
        <div class="pick-dish-item-main">
          <div class="pick-dish-item-name">${d.is_memory_meal ? '❤️ ' : ''}${esc(d.name)}</div>
          <div class="pick-dish-item-tags">${tagPills}</div>
        </div>
        ${ICONS.chevRight.replace('<svg', '<svg style="width:16px;height:16px;color:var(--text-tertiary)"')}
      </div>`;
  }).join('');

  return `
    <div class="sheet-grabber"></div>
    <div class="sheet-header">
      <span class="sheet-title">Pick a dish</span>
      <button class="sheet-close" data-action="close-sheet">${ICONS.x}</button>
    </div>
    <div class="sheet-body">
      ${activityHint}
      <button class="suggest-row" data-action="open-suggestions">${ICONS.sparkles} Suggest something for me</button>
      <div class="input-icon-wrap mb-12">
        ${ICONS.search.replace('<svg', '<svg class="input-icon"')}
        <input class="input" type="search" placeholder="Search dishes…" value="${esc(search)}" data-action="pick-search">
      </div>
      <div class="chips-scroll mb-12">${filterChips}</div>
      ${rows || '<div class="text-tertiary" style="text-align:center;padding:20px 0">No dishes found</div>'}
      <button class="add-new-dish-row" data-action="add-dish-from-pick">
        ${ICONS.plus} Add new dish
      </button>
    </div>`;
}

// ── Suggestions ────────────────────────────────────────────────

function suggestionsSheet() {
  const { date } = S.sheetData;

  let body = '';
  if (!S.suggestions || S.suggestions === 'loading') {
    body = `<div class="thinking-state"><div class="spinner"></div><span>Thinking of ideas…</span></div>`;
    if (!S.suggestions) {
      S.suggestions = 'loading';
      fetchSuggestions(date);
    }
  } else {
    body = S.suggestions.map(s => {
      const inLib = S.dishes.find(d => d.name.toLowerCase() === s.name.toLowerCase());
      return `
        <div class="suggestion-card">
          ${inLib ? `<div class="suggestion-badge">${ICONS.check.replace('<svg','<svg style="width:12px;height:12px"')} In library</div>` : ''}
          <div class="suggestion-name">${esc(s.name)}</div>
          <div class="suggestion-rationale">${esc(s.rationale)}</div>
          ${inLib
            ? `<button class="btn btn-outline btn-full btn-sm" data-action="use-suggestion" data-name="${esc(s.name)}">Use this dish</button>`
            : `<button class="btn btn-primary btn-full btn-sm" data-action="add-and-use" data-name="${esc(s.name)}">Add to library &amp; use</button>`
          }
        </div>`;
    }).join('');
  }

  return `
    <div class="sheet-grabber"></div>
    <div class="sheet-header">
      <div>
        <button class="link-btn" data-action="back-to-pick">${ICONS.chevLeft.replace('<svg','<svg style="width:16px;height:16px"')} Back to dish list</button>
        <div class="sheet-title" style="margin-top:4px">Suggestions</div>
      </div>
      <button class="sheet-close" data-action="close-sheet">${ICONS.x}</button>
    </div>
    <div class="sheet-body" id="suggestions-body">${body}</div>
    <div class="sheet-footer">
      <button class="btn btn-outline btn-full" data-action="refresh-suggestions">${ICONS.sparkles} Get new suggestions</button>
    </div>`;
}

async function fetchSuggestions(date) {
  const recentDishes = Object.values(S.mealPlan)
    .flatMap(day => (day.dishes || []).map(e => e.dish_id))
    .map(id => S.dishes.find(d => d.id === id)?.name)
    .filter(Boolean);

  const dishNames = S.dishes.map(d => `${d.name} [${(d.tags||[]).join(',')}]`);
  const pantryItems = S.pantry.filter(i => (parseFloat(i.qty)||0) > 0).map(i => i.name);

  let suggestions = [];

  if (CLAUDE_API_KEY) {
    try {
      const prompt = `Family's dishes: ${dishNames.slice(0,30).join('; ')}\nRecent meals: ${recentDishes.slice(0,7).join(', ') || 'none'}\nPantry has: ${pantryItems.slice(0,20).join(', ') || 'unknown'}\n\nSuggest 3 dinner ideas. Prefer variety and using pantry items. Return JSON array: [{name, rationale, isInLibrary}] where isInLibrary is whether the dish name matches any in the family's list. Rationale = 1 sentence. No markdown.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '[]';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) suggestions = JSON.parse(jsonMatch[0]);
    } catch(e) { console.error('AI suggestions error:', e); }
  }

  if (!suggestions.length) {
    // Fallback: suggest random dishes not in recent plan
    const used = new Set(recentDishes);
    const pool = S.dishes.filter(d => !used.has(d.name));
    const picked = pool.sort(() => Math.random()-0.5).slice(0, 3);
    suggestions = picked.length ? picked.map(d => ({
      name: d.name,
      rationale: "A family favourite that hasn't been on the menu recently.",
      isInLibrary: true,
    })) : [
      { name: 'Spaghetti Bolognese', rationale: 'A classic crowd-pleaser that\'s always a hit.', isInLibrary: false },
      { name: 'Sheet Pan Chicken', rationale: 'Easy, healthy, and minimal cleanup.', isInLibrary: false },
      { name: 'Tacos', rationale: 'Quick, fun, and customizable for the whole family.', isInLibrary: false },
    ];
  }

  S.suggestions = suggestions;
  const body = document.getElementById('suggestions-body');
  if (body) {
    // re-render suggestions body
    const rendered = suggestionsSheet();
    const tmp = document.createElement('div');
    tmp.innerHTML = rendered;
    const newBody = tmp.querySelector('#suggestions-body');
    if (newBody) body.innerHTML = newBody.innerHTML;
  }
}

// ── Add/Edit Dish ──────────────────────────────────────────────

function addEditDishSheet() {
  const dish = S.sheetData.dish || {};
  const isEdit = !!dish.id;
  const selTags     = dish.tags     || [];
  const selCustom   = dish.custom_tags || [];
  const selAppliances = dish.appliances || [];
  const ingredients = dish.ingredients || [];
  const isMemory    = dish.is_memory_meal || false;

  const tagChips = TAGS.map(t =>
    `<button class="appliance-chip ${selTags.includes(t.id)?'selected':''}" data-action="toggle-dish-tag" data-tag="${t.id}">${t.emoji} ${t.label}</button>`
  ).join('');

  const applianceChips = APPLIANCES.map(a =>
    `<button class="appliance-chip ${selAppliances.includes(a.id)?'selected':''}" data-action="toggle-appliance" data-id="${a.id}">${a.emoji} ${a.label}</button>`
  ).join('');

  const ingRows = ingredients.map((ing, i) => ingredientRow(ing, i)).join('');

  return `
    <div class="sheet-grabber"></div>
    <div class="sheet-header">
      <span class="sheet-title">${isEdit ? 'Edit Dish' : 'Add New Dish'}</span>
      <button class="sheet-close" data-action="close-sheet">${ICONS.x}</button>
    </div>
    <div class="sheet-body">
      <div class="field mb-12">
        <label>Dish Name</label>
        <input class="input" id="dish-name" type="text" placeholder="e.g. Chicken Parmesan" value="${esc(dish.name||'')}">
      </div>

      <div class="field mb-12">
        <label>Tags</label>
        <div class="chips-wrap" id="dish-tag-chips">${tagChips}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <input class="input" id="custom-tag-input" type="text" placeholder="Add custom tag…" style="flex:1">
          <button class="btn btn-outline btn-sm" data-action="add-custom-tag">Add</button>
        </div>
        <div class="chips-wrap mt-8" id="custom-tags-wrap">
          ${selCustom.map(t => `<span class="chip active" data-custom="${esc(t)}">${esc(t)} <button data-action="remove-custom-tag" data-tag="${esc(t)}" style="margin-left:4px;opacity:0.7">&times;</button></span>`).join('')}
        </div>
      </div>

      <div class="field mb-12">
        <label>Appliances</label>
        <div class="chips-wrap">${applianceChips}</div>
      </div>

      <div class="field mb-12">
        <label>Ingredients</label>
        <div id="ingredients-list">${ingRows}</div>
        <button class="link-btn mt-8" data-action="add-ingredient">+ Add ingredient</button>
      </div>

      <div class="toggle-row">
        <div>
          <div class="toggle-row-label">❤️ Memory Meal</div>
          <div class="toggle-row-sub">A family favourite with a story</div>
        </div>
        <div class="toggle ${isMemory?'on':''}" id="memory-toggle" data-action="toggle-memory" aria-label="Memory meal toggle">
          <div class="toggle-thumb"></div>
        </div>
      </div>
    </div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" data-action="${isEdit?'update-dish':'save-dish'}" ${dish.id?`data-id="${dish.id}"`:''}>
        ${isEdit ? 'Update Dish' : 'Add Dish'}
      </button>
    </div>`;
}

function ingredientRow(ing, i) {
  const units = ['','lbs','oz','cups','tbsp','tsp','cans','bags','heads','bunches','pints','boxes'];
  return `
    <div class="ingredient-row" data-ing-idx="${i}">
      <div class="field ingredient-name"><label>Ingredient</label>
        <input class="input" name="ing-name-${i}" value="${esc(ing.name||'')}" placeholder="e.g. Chicken breast">
      </div>
      <div class="field ingredient-qty"><label>Qty</label>
        <input class="input" name="ing-qty-${i}" type="number" value="${esc(ing.qty||'')}" min="0" step="0.5">
      </div>
      <div class="field ingredient-unit"><label>Unit</label>
        <input class="input" name="ing-unit-${i}" value="${esc(ing.unit||'')}" placeholder="lbs, cups…" list="unit-list">
      </div>
      <div class="field ingredient-cat"><label>Category</label>
        <select class="input" name="ing-cat-${i}">
          ${ING_CATEGORIES.map(c => `<option ${ing.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <button class="ingredient-remove" data-action="remove-ingredient" data-idx="${i}" aria-label="Remove">${ICONS.x}</button>
    </div>`;
}

// ── Add/Edit Pantry ─────────────────────────────────────────────

function addEditPantrySheet() {
  const item = S.sheetData.item || {};
  const isEdit = !!item.id;
  return `
    <div class="sheet-grabber"></div>
    <div class="sheet-header">
      <span class="sheet-title">${isEdit ? 'Edit Item' : 'Add Pantry Item'}</span>
      <button class="sheet-close" data-action="close-sheet">${ICONS.x}</button>
    </div>
    <div class="sheet-body">
      <div class="field mb-12">
        <label>Item Name</label>
        <input class="input" id="pantry-name" type="text" placeholder="e.g. Chicken Broth" value="${esc(item.name||'')}">
      </div>
      <div class="input-row mb-12">
        <div class="field">
          <label>Quantity</label>
          <input class="input" id="pantry-qty" type="number" value="${item.qty ?? 2}" min="0" step="0.5">
        </div>
        <div class="field">
          <label>Unit</label>
          <input class="input" id="pantry-unit" type="text" placeholder="lbs, cups, cans…" value="${esc(item.unit||'')}">
        </div>
      </div>
      <div class="field mb-12">
        <label>Category</label>
        <select class="input" id="pantry-cat">
          ${ING_CATEGORIES.map(c => `<option ${item.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="input-row mb-12">
        <div class="field">
          <label>Expiry Date (optional)</label>
          <input class="input" id="pantry-expiry" type="date" value="${item.expiry_date||''}">
        </div>
        <div class="field">
          <label>Low-stock alert at</label>
          <input class="input" id="pantry-alert" type="number" value="${item.low_stock_alert_at ?? 1}" min="0">
        </div>
      </div>
    </div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" id="pantry-save-btn" data-action="${isEdit?'update-pantry':'save-pantry'}" ${item.id?`data-id="${item.id}"`:''}>
        ${isEdit ? 'Update Item' : 'Add to Pantry'}
      </button>
    </div>`;
}

// ── Activity Sheet ─────────────────────────────────────────────

function activitySheet() {
  const { date } = S.sheetData;
  const selectedImpact = S.sheetData.impact || 'custom';

  const options = IMPACT_TYPES.map(t =>
    `<div class="impact-option ${selectedImpact===t.id?'selected':''}" data-action="select-impact" data-type="${t.id}">
      <span class="impact-option-icon">${t.icon}</span>
      <span class="impact-option-label">${t.label}</span>
      <span class="impact-option-desc">${t.desc}</span>
    </div>`
  ).join('');

  return `
    <div class="sheet-grabber"></div>
    <div class="sheet-header">
      <span class="sheet-title">Activity Tonight</span>
      <button class="sheet-close" data-action="close-sheet">${ICONS.x}</button>
    </div>
    <div class="sheet-body">
      <div class="field mb-12">
        <label>What's happening?</label>
        <input class="input" id="activity-text" type="text" placeholder="e.g. Soccer 5–7pm, Meeting 6–8pm…">
      </div>
      <div class="field">
        <label>Impact on dinner</label>
        <div class="impact-grid">${options}</div>
      </div>
    </div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" data-action="save-activity" data-date="${date}">Save Activity</button>
    </div>`;
}

// ── Templates Sheet ────────────────────────────────────────────

function templatesSheet() {
  const tab = S.templateTab || 'load';

  const loadTab = S.templates.length === 0
    ? `<div class="empty-state">${ICONS.grid}<div class="empty-state-title">No templates yet</div><div class="empty-state-sub">Save this week as a template →</div></div>`
    : S.templates.map(t =>
        `<div class="template-item">
          <span class="template-name">${esc(t.name)}</span>
          <div class="template-actions">
            <button class="btn btn-outline btn-sm" data-action="load-template" data-id="${t.id}">Load</button>
            <button class="dish-action-btn danger" data-action="del-template" data-id="${t.id}" aria-label="Delete">${ICONS.trash}</button>
          </div>
        </div>`
      ).join('');

  const saveTab = `
    <div class="field mb-12">
      <label>Template Name</label>
      <input class="input" id="template-name" type="text" placeholder="e.g. Summer Rotation, Busy Week…">
    </div>
    <button class="btn btn-primary btn-full" data-action="save-template">Save This Week</button>`;

  return `
    <div class="sheet-grabber"></div>
    <div class="sheet-header">
      <span class="sheet-title">Meal Templates</span>
      <button class="sheet-close" data-action="close-sheet">${ICONS.x}</button>
    </div>
    <div class="sheet-body">
      <div class="template-tabs">
        <button class="template-tab ${tab==='load'?'active':''}" data-action="template-tab" data-tab="load">Load Template</button>
        <button class="template-tab ${tab==='save'?'active':''}" data-action="template-tab" data-tab="save">Save Current Week</button>
      </div>
      ${tab === 'load' ? loadTab : saveTab}
    </div>`;
}

// ── Import URL ─────────────────────────────────────────────────

function importUrlSheet() {
  return `
    <div class="sheet-grabber"></div>
    <div class="sheet-header">
      <span class="sheet-title">Import from URL</span>
      <button class="sheet-close" data-action="close-sheet">${ICONS.x}</button>
    </div>
    <div class="sheet-body">
      <p class="text-muted" style="font-size:14px;margin-bottom:16px">Paste a recipe URL from AllRecipes, Food Network, NYT Cooking, or any recipe site.</p>
      <div class="field mb-12">
        <label>Recipe URL</label>
        <div class="input-icon-wrap">
          ${ICONS.link.replace('<svg', '<svg class="input-icon"')}
          <input class="input" id="import-url" type="url" placeholder="https://…">
        </div>
      </div>
      <div id="import-result"></div>
    </div>
    <div class="sheet-footer">
      <button class="btn btn-primary btn-full" data-action="import-url">Import</button>
    </div>`;
}

// ─── Event Delegation ──────────────────────────────────────────

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) {
    // Click outside sheet → close
    if (e.target === document.getElementById('sheet-overlay')) closeSheet();
    if (e.target === document.getElementById('splash')) hideSplash();
    return;
  }

  const action = btn.dataset.action;
  const d      = btn.dataset;

  switch (action) {

    // ── Navigation ─────────────────────────────────────────────
    case 'nav':
      if (d.page === 'home') showSplash();
      else { S.page = d.page; renderApp(); }
      break;

    case 'prev-week':
      S.weekStart = addDays(S.weekStart, -7);
      await loadWeekData();
      renderApp();
      break;

    case 'next-week':
      S.weekStart = addDays(S.weekStart, 7);
      await loadWeekData();
      renderApp();
      break;

    case 'week-mode':
      S.weekMode = d.mode;
      S.weekStart = getWeekStart();
      await loadWeekData();
      renderApp();
      break;

    case 'clear-week':
      if (!confirm('Clear all meals for this week?')) break;
      {
        const days = getWeekDays();
        await DB.clearMealPlanRange(S.family.id, fmtDate(days[0]), fmtDate(days[6]));
        await loadWeekData();
        renderApp();
      }
      break;

    // ── Sheets ─────────────────────────────────────────────────
    case 'open-sheet':
      openSheet(d.sheet, {});
      break;

    case 'close-sheet':
      closeSheet();
      break;

    case 'back-to-pick':
      openSheet('pick-dish', S.sheetData);
      break;

    case 'open-suggestions':
      S.suggestions = null;
      openSheet('suggestions', S.sheetData);
      break;

    case 'refresh-suggestions':
      S.suggestions = null;
      renderSheet();
      break;

    // ── Pick Dish ───────────────────────────────────────────────
    case 'pick-dish':
      openSheet('pick-dish', { date: d.date, isSide: d.side === '1' });
      break;

    case 'pick-filter': {
      const t = d.tag;
      const idx = S.dishFilter.tags.indexOf(t);
      if (idx === -1) S.dishFilter.tags.push(t); else S.dishFilter.tags.splice(idx, 1);
      renderSheet();
      break;
    }

    case 'pick-search':
      S.dishFilter.search = btn.value;
      renderSheet();
      break;

    case 'select-dish': {
      const dishId = d.id;
      const { date, isSide } = S.sheetData;
      await doAddDishToDay(date, dishId, isSide);
      closeSheet();
      renderApp();
      break;
    }

    case 'add-dish-from-pick':
      openSheet('add-dish', { returnTo: 'pick-dish', returnData: S.sheetData });
      break;

    // ── Dish CRUD ───────────────────────────────────────────────
    case 'add-dish':
      openSheet('add-dish', { dish: {} });
      break;

    case 'edit-dish': {
      const dish = S.dishes.find(x => x.id === d.id);
      if (dish) openSheet('edit-dish', { dish });
      break;
    }

    case 'toggle-dish-tag': {
      const panel = document.querySelector('#dish-tag-chips');
      if (!panel) break;
      const dish = S.sheetData.dish ||= {};
      const tags = dish.tags ||= [];
      const idx = tags.indexOf(d.tag);
      if (idx === -1) tags.push(d.tag); else tags.splice(idx, 1);
      btn.classList.toggle('selected', tags.includes(d.tag));
      break;
    }

    case 'toggle-appliance': {
      const dish = S.sheetData.dish ||= {};
      const apps = dish.appliances ||= [];
      const idx = apps.indexOf(d.id);
      if (idx === -1) apps.push(d.id); else apps.splice(idx, 1);
      btn.classList.toggle('selected', apps.includes(d.id));
      break;
    }

    case 'toggle-memory': {
      const dish = S.sheetData.dish ||= {};
      dish.is_memory_meal = !dish.is_memory_meal;
      btn.classList.toggle('on', dish.is_memory_meal);
      break;
    }

    case 'add-ingredient': {
      const list = document.getElementById('ingredients-list');
      if (!list) break;
      const dish = S.sheetData.dish ||= {};
      const ings = dish.ingredients ||= [];
      const idx = ings.length;
      ings.push({ name: '', qty: '', unit: '', category: 'Other' });
      const div = document.createElement('div');
      div.innerHTML = ingredientRow({}, idx);
      list.appendChild(div.firstElementChild);
      break;
    }

    case 'remove-ingredient': {
      const row = btn.closest('.ingredient-row');
      if (row) row.remove();
      break;
    }

    case 'add-custom-tag': {
      const input = document.getElementById('custom-tag-input');
      const val = input?.value.trim();
      if (!val) break;
      const dish = S.sheetData.dish ||= {};
      (dish.custom_tags ||= []).push(val);
      input.value = '';
      const wrap = document.getElementById('custom-tags-wrap');
      if (wrap) {
        const span = document.createElement('span');
        span.className = 'chip active';
        span.dataset.custom = val;
        span.innerHTML = `${esc(val)} <button data-action="remove-custom-tag" data-tag="${esc(val)}" style="margin-left:4px;opacity:0.7">&times;</button>`;
        wrap.appendChild(span);
      }
      break;
    }

    case 'remove-custom-tag': {
      const dish = S.sheetData.dish ||= {};
      const tags = dish.custom_tags || [];
      const idx = tags.indexOf(d.tag);
      if (idx !== -1) tags.splice(idx, 1);
      btn.closest('[data-custom]')?.remove();
      break;
    }

    case 'save-dish':
    case 'update-dish': {
      const saved = await collectAndSaveDish(d.id);
      if (!saved) break;
      if (S.sheetData.returnTo) {
        openSheet(S.sheetData.returnTo, S.sheetData.returnData || {});
      } else {
        closeSheet();
        renderApp();
      }
      break;
    }

    case 'del-dish': {
      if (!confirm('Delete this dish?')) break;
      await DB.deleteDish(d.id);
      S.dishes = S.dishes.filter(x => x.id !== d.id);
      renderApp();
      break;
    }

    // ── Dish on Day ─────────────────────────────────────────────
    case 'remove-dish': {
      const plan = S.mealPlan[d.date];
      if (!plan) break;
      const dishes = (plan.dishes || []).filter(e => e.dish_id !== d.dish);
      const updated = await DB.saveMealPlanDay(S.family.id, d.date, dishes);
      S.mealPlan[d.date] = updated;
      renderApp();
      break;
    }

    case 'vote': {
      const plan = S.mealPlan[d.date];
      if (!plan) break;
      const dishes = (plan.dishes || []).map(e => {
        if (e.dish_id !== d.dish) return e;
        const votes = e.votes || { up: [], down: [] };
        const list = votes[d.type] || [];
        const me = 'me';
        const idx2 = list.indexOf(me);
        if (idx2 === -1) list.push(me); else list.splice(idx2, 1);
        votes[d.type] = list;
        return { ...e, votes };
      });
      const updated = await DB.saveMealPlanDay(S.family.id, d.date, dishes);
      S.mealPlan[d.date] = updated;
      renderApp();
      break;
    }

    // ── Suggestions ─────────────────────────────────────────────
    case 'use-suggestion': {
      const dish = S.dishes.find(x => x.name.toLowerCase() === d.name.toLowerCase());
      if (dish) {
        await doAddDishToDay(S.sheetData.date, dish.id, false);
        closeSheet();
        renderApp();
      }
      break;
    }

    case 'add-and-use': {
      const newDish = await DB.upsertDish({ family_id: S.family.id, name: d.name, tags: [], custom_tags: [], appliances: [], ingredients: [], is_memory_meal: false });
      S.dishes.push(newDish);
      S.dishes.sort((a,b) => a.name.localeCompare(b.name));
      await doAddDishToDay(S.sheetData.date, newDish.id, false);
      closeSheet();
      renderApp();
      break;
    }

    // ── Activities ──────────────────────────────────────────────
    case 'open-activity':
      openSheet('activity', { date: d.date, impact: 'custom' });
      break;

    case 'select-impact': {
      S.sheetData.impact = d.type;
      document.querySelectorAll('.impact-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.type === d.type);
      });
      break;
    }

    case 'save-activity': {
      const text = document.getElementById('activity-text')?.value.trim();
      if (!text) { alert('Please enter a description.'); break; }
      const impact = S.sheetData.impact || 'custom';
      const act = await DB.insertActivity(S.family.id, d.date, text, impact);
      (S.activities[d.date] ||= []).push(act);
      closeSheet();
      renderApp();
      break;
    }

    case 'del-activity': {
      await DB.deleteActivity(d.id);
      for (const date of Object.keys(S.activities)) {
        S.activities[date] = S.activities[date].filter(a => a.id !== d.id);
      }
      renderApp();
      break;
    }

    // ── Pantry ──────────────────────────────────────────────────
    case 'add-pantry':
      openSheet('add-pantry', { item: {} });
      break;

    case 'edit-pantry': {
      const item = S.pantry.find(x => x.id === d.id);
      if (item) openSheet('edit-pantry', { item });
      break;
    }

    case 'save-pantry':
    case 'update-pantry': {
      const saved = await collectAndSavePantry(d.id);
      if (saved) { closeSheet(); renderApp(); }
      break;
    }

    case 'del-pantry': {
      if (!confirm('Remove this pantry item?')) break;
      await DB.deletePantryItem(d.id);
      S.pantry = S.pantry.filter(x => x.id !== d.id);
      renderApp();
      break;
    }

    case 'pantry-qty': {
      const delta = parseFloat(d.delta);
      const updated = await DB.adjustPantryQty(d.id, delta);
      const idx = S.pantry.findIndex(x => x.id === d.id);
      if (idx !== -1) S.pantry[idx] = updated;
      renderApp();
      break;
    }

    case 'toggle-pantry-group':
      S.pantryOpen[d.group] = !S.pantryOpen[d.group];
      renderApp();
      break;

    case 'pantry-instock':
      S.pantryFilter.inStockOnly = !S.pantryFilter.inStockOnly;
      renderApp();
      break;

    case 'pantry-expand-all':
      PANTRY_GROUPS.forEach(g => S.pantryOpen[g] = true);
      renderApp();
      break;

    case 'pantry-collapse-all':
      PANTRY_GROUPS.forEach(g => S.pantryOpen[g] = false);
      renderApp();
      break;

    // ── Shopping ────────────────────────────────────────────────
    case 'add-shopping-manual': {
      const input = document.getElementById('shop-input');
      const name = input?.value.trim();
      if (!name) break;
      const item = await DB.insertShoppingItem(S.family.id, { name, added_from: 'manual' });
      S.shopping.push(item);
      if (input) input.value = '';
      renderApp();
      break;
    }

    case 'toggle-shopping': {
      const checked = d.checked === '1';
      const updated = await DB.updateShoppingChecked(d.id, checked);
      const idx = S.shopping.findIndex(x => x.id === d.id);
      if (idx !== -1) S.shopping[idx] = updated;
      renderApp();
      break;
    }

    case 'del-shopping': {
      await DB.deleteShoppingItem(d.id);
      S.shopping = S.shopping.filter(x => x.id !== d.id);
      renderApp();
      break;
    }

    case 'clear-checked': {
      if (!confirm('Remove all checked items?')) break;
      await DB.clearCheckedShopping(S.family.id);
      S.shopping = S.shopping.filter(x => !x.checked_off);
      renderApp();
      break;
    }

    case 'generate-shopping':
      await generateShopping();
      break;

    // ── Templates ───────────────────────────────────────────────
    case 'template-tab':
      S.templateTab = d.tab;
      renderSheet();
      break;

    case 'save-template': {
      const name = document.getElementById('template-name')?.value.trim();
      if (!name) { alert('Enter a template name.'); break; }
      const days = getWeekDays().map(date => {
        const ds = fmtDate(date);
        const plan = S.mealPlan[ds];
        const dishIds = (plan?.dishes || []).map(e => e.dish_id);
        return { weekday: date.getDay(), dish_ids: dishIds };
      });
      const tmpl = await DB.insertTemplate(S.family.id, name, days);
      S.templates.push(tmpl);
      S.templateTab = 'load';
      renderSheet();
      break;
    }

    case 'load-template': {
      const tmpl = S.templates.find(t => t.id === d.id);
      if (!tmpl) break;
      if (!confirm(`Load template "${tmpl.name}"? This will overwrite the current week.`)) break;
      const days = getWeekDays();
      const planDays = tmpl.days || [];
      for (const day of days) {
        const dow = day.getDay();
        const tmplDay = planDays.find(td => td.weekday === dow);
        const dishIds = tmplDay?.dish_ids || [];
        const dishes  = dishIds.map(id => ({ dish_id: id, votes: { up: [], down: [] }, side_dishes: [] }));
        const ds = fmtDate(day);
        const updated = await DB.saveMealPlanDay(S.family.id, ds, dishes);
        S.mealPlan[ds] = updated;
      }
      closeSheet();
      renderApp();
      break;
    }

    case 'del-template': {
      if (!confirm('Delete this template?')) break;
      await DB.deleteTemplate(d.id);
      S.templates = S.templates.filter(t => t.id !== d.id);
      renderSheet();
      break;
    }

    // ── Import URL ──────────────────────────────────────────────
    case 'import-url': {
      const url = document.getElementById('import-url')?.value.trim();
      if (!url) break;
      const result = document.getElementById('import-result');
      if (result) result.innerHTML = `<div class="thinking-state"><div class="spinner"></div><span>Importing…</span></div>`;
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const title = doc.querySelector('h1')?.textContent?.trim() ||
                      doc.querySelector('title')?.textContent?.trim() ||
                      'Imported Recipe';
        // Open add-dish sheet pre-filled
        openSheet('add-dish', { dish: { name: title, source_url: url, tags: [], custom_tags: [], appliances: [], ingredients: [] } });
      } catch(ex) {
        if (result) result.innerHTML = `<div class="error-msg">Could not import. Try adding the dish manually.</div>`;
      }
      break;
    }

    // ── Settings ────────────────────────────────────────────────
    case 'copy-url': {
      await navigator.clipboard.writeText(shareUrl());
      btn.innerHTML = ICONS.check;
      setTimeout(() => { btn.innerHTML = ICONS.copy; }, 2000);
      break;
    }

    case 'share-family': {
      if (navigator.share) {
        navigator.share({ title: 'Family Dinner Time', text: `Join ${S.family.name}'s meal plan!`, url: shareUrl() });
      } else {
        await navigator.clipboard.writeText(shareUrl());
        alert('Link copied to clipboard!');
      }
      break;
    }

    case 'leave-family': {
      if (!confirm('Leave this family? You can rejoin with the family code.')) break;
      localStorage.removeItem('fdt_code');
      S.family = null; S.dishes = []; S.pantry = []; S.shopping = []; S.mealPlan = {}; S.activities = {};
      renderApp();
      break;
    }

    // ── Onboarding ──────────────────────────────────────────────
    case 'join-family': {
      const code = document.getElementById('ob-code')?.value.trim();
      if (!code) { S.onboardError = 'Enter a family code.'; renderApp(); break; }
      await loadFamily(code);
      break;
    }

    case 'create-family': {
      const name = document.getElementById('ob-name')?.value.trim();
      if (!name) { S.onboardError = 'Enter a family name.'; renderApp(); break; }
      const code = generateCode();
      S.loading = true; renderApp();
      try {
        const fam = await DB.createFamily(code, name);
        S.family = fam;
        localStorage.setItem('fdt_code', code);
        await loadAll();
        S.page = 'plan';
      } catch(ex) {
        S.onboardError = `Error: ${ex.message}`;
        S.family = null;
      }
      S.loading = false;
      renderApp();
      break;
    }

    // ── Splash ──────────────────────────────────────────────────
    case 'dismiss-splash':
      hideSplash();
      break;
  }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  const action = el.dataset.action;
  if (action === 'dish-search') {
    S.dishFilter.search = el.value;
    renderApp();
  } else if (action === 'pantry-search') {
    S.pantryFilter.search = el.value;
    renderApp();
  } else if (action === 'pick-search') {
    S.dishFilter.search = el.value;
    renderSheet();
  }
});

// Enter key submits onboarding forms
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const el = e.target;
  if (el.id === 'ob-code') document.querySelector('[data-action="join-family"]')?.click();
  if (el.id === 'ob-name') document.querySelector('[data-action="create-family"]')?.click();
  if (el.id === 'shop-input') document.querySelector('[data-action="add-shopping-manual"]')?.click();
  if (el.id === 'activity-text') document.querySelector('[data-action="save-activity"]')?.click();
});

// ─── Action Helpers ────────────────────────────────────────────

async function doAddDishToDay(date, dishId, isSide) {
  const plan = S.mealPlan[date];
  const existing = plan?.dishes || [];
  if (existing.find(e => e.dish_id === dishId)) return;
  const newEntry = { dish_id: dishId, votes: { up: [], down: [] }, side_dishes: [], is_side: !!isSide };
  const updated = await DB.saveMealPlanDay(S.family.id, date, [...existing, newEntry]);
  S.mealPlan[date] = updated;
}

async function collectAndSaveDish(id) {
  const name = document.getElementById('dish-name')?.value.trim();
  if (!name) { alert('Enter a dish name.'); return null; }

  const dish = S.sheetData.dish || {};

  // collect ingredients from DOM
  const ingRows = document.querySelectorAll('.ingredient-row');
  const ingredients = [];
  ingRows.forEach((row, i) => {
    const n = row.querySelector(`[name^="ing-name"]`)?.value?.trim();
    if (!n) return;
    ingredients.push({
      name: n,
      qty:  parseFloat(row.querySelector(`[name^="ing-qty"]`)?.value) || 0,
      unit: row.querySelector(`[name^="ing-unit"]`)?.value?.trim() || '',
      category: row.querySelector(`[name^="ing-cat"]`)?.value || 'Other',
    });
  });

  const payload = {
    family_id: S.family.id,
    name,
    tags: dish.tags || [],
    custom_tags: dish.custom_tags || [],
    appliances: dish.appliances || [],
    ingredients,
    is_memory_meal: dish.is_memory_meal || false,
    source_url: dish.source_url || null,
  };

  if (id) payload.id = id;

  const saved = await DB.upsertDish(payload);

  const idx = S.dishes.findIndex(x => x.id === saved.id);
  if (idx !== -1) S.dishes[idx] = saved; else S.dishes.push(saved);
  S.dishes.sort((a,b) => a.name.localeCompare(b.name));
  return saved;
}

async function collectAndSavePantry(id) {
  const name = document.getElementById('pantry-name')?.value.trim();
  if (!name) { alert('Enter an item name.'); return null; }
  const payload = {
    family_id: S.family.id,
    name,
    qty: parseFloat(document.getElementById('pantry-qty')?.value) || 0,
    unit: document.getElementById('pantry-unit')?.value.trim() || '',
    category: document.getElementById('pantry-cat')?.value || 'Other',
    expiry_date: document.getElementById('pantry-expiry')?.value || null,
    low_stock_alert_at: parseFloat(document.getElementById('pantry-alert')?.value) || 1,
  };
  if (id) payload.id = id;
  const saved = await DB.upsertPantryItem(payload);
  const idx = S.pantry.findIndex(x => x.id === saved.id);
  if (idx !== -1) S.pantry[idx] = saved; else S.pantry.push(saved);
  S.pantry.sort((a,b) => a.name.localeCompare(b.name));
  return saved;
}

async function generateShopping() {
  const days = getWeekDays();
  const dishIds = new Set();
  for (const day of days) {
    const plan = S.mealPlan[fmtDate(day)];
    (plan?.dishes || []).forEach(e => dishIds.add(e.dish_id));
  }

  const pantryMap = {};
  S.pantry.forEach(i => { pantryMap[i.name.toLowerCase()] = parseFloat(i.qty) || 0; });

  const existing = new Set(S.shopping.map(i => i.name.toLowerCase()));
  const toAdd = [];

  for (const dishId of dishIds) {
    const dish = S.dishes.find(d => d.id === dishId);
    if (!dish) continue;
    for (const ing of (dish.ingredients || [])) {
      if (!ing.name) continue;
      const key = ing.name.toLowerCase();
      if (existing.has(key)) continue;
      const inPantry = pantryMap[key] || 0;
      const needed = ing.qty || 1;
      if (inPantry >= needed) continue;
      existing.add(key);
      toAdd.push({ name: ing.name, qty: needed - inPantry || null, unit: ing.unit || null, category: ing.category || null, added_from: 'generate' });
    }
  }

  if (!toAdd.length) { alert('All ingredients for this week are in your pantry, or no dishes have ingredients added.'); return; }

  for (const item of toAdd) {
    const saved = await DB.insertShoppingItem(S.family.id, item);
    S.shopping.push(saved);
  }
  renderApp();
}

// ─── Init ──────────────────────────────────────────────────────

async function init() {
  // Check URL param
  const params = new URLSearchParams(location.search);
  const urlCode = params.get('code');
  const savedCode = localStorage.getItem('fdt_code');
  const code = urlCode || savedCode;

  if (code) {
    await loadFamily(code);
  } else {
    renderApp();
  }
}

init();
