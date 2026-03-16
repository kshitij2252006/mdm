/* ============================================================
   ui.js — renders shared sidebar + topbar
   Call UI.render(activePage) on DOMContentLoaded
   activePage: 'overview' | 'tracking' | 'shipments' | 'analytics'
   ============================================================ */

const UI = (() => {

  const PROFILE_STORAGE_KEY = 'swift_profile';

  const STORAGE_KEYS = {
    compactMode: 'swift_ui_compact_mode',
    muteNotifications: 'swift_ui_mute_notifications',
  };

  const NOTIFICATIONS = [];

  const NAV = [
    { id: 'overview',  icon: 'dashboard',   label: 'Overview',   href: 'index.html' },
    { id: 'tracking',  icon: 'location_on',  label: 'Tracking',   href: 'tracking.html' },
    { id: 'shipments', icon: 'inventory_2',  label: 'Shipments',  href: 'shipments.html' },
    { id: 'analytics', icon: 'analytics',    label: 'Analytics',  href: 'analytics.html' },
  ];

  function getProfile() {
    const fallback = {
      name: 'SwiftDelivery HQ',
      role: 'Logistics Pro',
      email: 'team@swiftdelivery.local',
      avatar: 'https://i.pravatar.cc/80?img=12',
    };

    try {
      const stored = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
      return {
        name: stored.name || fallback.name,
        role: stored.role || fallback.role,
        email: stored.email || fallback.email,
        avatar: stored.avatar || fallback.avatar,
      };
    } catch (_err) {
      return fallback;
    }
  }

  function sidebar(active) {
    const profile = getProfile();

    return `
      <aside class="sidebar">
        <div class="sidebar__brand">
          <div class="sidebar__logo-icon">
            <span class="material-symbols-outlined">local_shipping</span>
          </div>
          <span class="sidebar__brand-name">SwiftDelivery</span>
        </div>

        <nav class="sidebar__nav">
          ${NAV.map(n => `
            <a href="${n.href}" class="nav-link ${active === n.id ? 'active' : ''}">
              <span class="material-symbols-outlined">${n.icon}</span>
              ${n.label}
            </a>
          `).join('')}
        </nav>

        <div class="sidebar__footer">
          <button class="sidebar__new-btn js-new-shipment-btn" type="button">
            <span class="material-symbols-outlined">add</span>
            New Shipment
          </button>
          <button class="sidebar__user js-profile-link" type="button">
            <div class="sidebar__avatar">
              <img src="${profile.avatar}" alt="${profile.name}" />
            </div>
            <div class="sidebar__user-info">
              <p class="role">${profile.role}</p>
              <p class="name">${profile.name}</p>
            </div>
          </button>
        </div>
      </aside>
    `;
  }

  function topbar(placeholder) {
    const profile = getProfile();

    return `
      <header class="topbar">
        <div class="topbar__search">
          <span class="material-symbols-outlined">search</span>
          <input type="text" class="js-topbar-search-input" placeholder="${placeholder || 'Track a shipment...'}" />
        </div>
        <div class="topbar__actions">
          <button class="topbar__icon-btn js-topbar-trigger" type="button" title="Notifications" data-panel="notifications" aria-expanded="false" aria-haspopup="true">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <button class="topbar__icon-btn js-topbar-trigger" type="button" title="Settings" data-panel="settings" aria-expanded="false" aria-haspopup="true">
            <span class="material-symbols-outlined">settings</span>
          </button>
          <button class="topbar__avatar js-profile-link" type="button" title="Profile">
            <img src="${profile.avatar}" alt="${profile.name}" />
          </button>
        </div>
      </header>
      <div class="topbar-panels" aria-live="polite">
        <section class="topbar-panel" data-panel="notifications" hidden>
          <div class="topbar-panel__header">
            <div>
              <p class="topbar-panel__eyebrow">Activity</p>
              <h3>Notifications</h3>
            </div>
            <span class="topbar-panel__count">${NOTIFICATIONS.length} new</span>
          </div>
          <div class="topbar-panel__list">
            <div class="empty-state empty-state--soft">
              <h3>No notifications</h3>
              <p>You are all caught up.</p>
            </div>
          </div>
        </section>

        <section class="topbar-panel" data-panel="settings" hidden>
          <div class="topbar-panel__header">
            <div>
              <p class="topbar-panel__eyebrow">Workspace</p>
              <h3>Settings</h3>
            </div>
          </div>
          <div class="topbar-panel__stack">
            <label class="topbar-toggle">
              <span>
                <strong>Compact mode</strong>
                <small>Tightens spacing for denser dashboards.</small>
              </span>
              <input class="js-setting-compact" type="checkbox" />
            </label>
            <label class="topbar-toggle">
              <span>
                <strong>Mute alerts</strong>
                <small>Hides the notification badge emphasis.</small>
              </span>
              <input class="js-setting-mute" type="checkbox" />
            </label>
          </div>
        </section>
      </div>
    `;
  }

  function setExpanded(trigger, expanded) {
    if (trigger) {
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      trigger.classList.toggle('is-active', expanded);
    }
  }

  function closePanels(root) {
    root.querySelectorAll('.topbar-panel').forEach((panel) => {
      panel.hidden = true;
    });
    root.querySelectorAll('.js-topbar-trigger').forEach((trigger) => {
      setExpanded(trigger, false);
    });
  }

  function togglePanel(root, panelName, trigger) {
    const panel = root.querySelector(`.topbar-panel[data-panel="${panelName}"]`);
    if (!panel) return;

    const shouldOpen = panel.hidden;
    closePanels(root);

    if (shouldOpen) {
      panel.hidden = false;
      setExpanded(trigger, true);
    }
  }

  function applySettings(root) {
    const compactMode = localStorage.getItem(STORAGE_KEYS.compactMode) === 'true';
    const muteNotifications = localStorage.getItem(STORAGE_KEYS.muteNotifications) === 'true';

    document.body.classList.toggle('ui-compact', compactMode);
    document.body.classList.toggle('ui-muted-notifications', muteNotifications);

    const compactInput = root.querySelector('.js-setting-compact');
    const muteInput = root.querySelector('.js-setting-mute');
    if (compactInput) compactInput.checked = compactMode;
    if (muteInput) muteInput.checked = muteNotifications;
  }

  function getSearchTargets() {
    return Array.from(document.querySelectorAll(
      '#content .shipment-item, #content tr, #content .route-item, #content .timeline-step, #content .metric-card, #content .kpi-card, #content .bento-card, #content .live-pulse, #content .route-card'
    ));
  }

  function runSearch(term) {
    const normalized = term.trim().toLowerCase();
    const targets = getSearchTargets();

    if (!normalized) {
      targets.forEach((item) => {
        item.hidden = false;
        item.classList.remove('ui-search-hit');
      });
      return;
    }

    targets.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const matched = text.includes(normalized);
      item.hidden = !matched;
      item.classList.toggle('ui-search-hit', matched);
    });
  }

  function bindSearch(root) {
    const input = root.querySelector('.js-topbar-search-input');
    if (!input) return;

    const sync = () => runSearch(input.value);

    input.addEventListener('input', sync);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        input.value = '';
        sync();
      }
    });
  }

  function bindPanels(root) {
    root.querySelectorAll('.js-topbar-trigger').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        togglePanel(root, trigger.dataset.panel, trigger);
      });
    });

    root.querySelectorAll('.topbar-panel').forEach((panel) => {
      panel.addEventListener('click', (event) => event.stopPropagation());
    });

    document.addEventListener('click', () => closePanels(root));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePanels(root);
    });
  }

  function bindSettings(root) {
    const compactInput = root.querySelector('.js-setting-compact');
    const muteInput = root.querySelector('.js-setting-mute');

    if (compactInput) {
      compactInput.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.compactMode, compactInput.checked ? 'true' : 'false');
        applySettings(root);
      });
    }

    if (muteInput) {
      muteInput.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.muteNotifications, muteInput.checked ? 'true' : 'false');
        applySettings(root);
      });
    }
  }

  function bindNavigation(root) {
    root.querySelectorAll('.js-profile-link').forEach((button) => {
      button.addEventListener('click', () => {
        window.location.href = 'profile.html';
      });
    });

    root.querySelectorAll('.js-new-shipment-btn').forEach((button) => {
      button.addEventListener('click', () => {
        window.location.href = 'new-shipment.html';
      });
    });
  }

  function render(activePage, searchPlaceholder) {
    const layout = document.getElementById('layout');
    if (!layout) return;

    const existingContent = document.getElementById('main-wrap');

    layout.insertAdjacentHTML('afterbegin', sidebar(activePage));

    if (existingContent) {
      existingContent.insertAdjacentHTML('afterbegin', topbar(searchPlaceholder));
      applySettings(existingContent);
      bindSearch(existingContent);
      bindPanels(existingContent);
      bindSettings(existingContent);
      bindNavigation(layout);
    }
  }

  return { render, getProfile };
})();
