// Shared frontend state + interactions for the Super Sheldon screens.
(function () {
  const KEY = 'supersheldon';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function write(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

  const app = {
    // Identifier is also stored in db.auth.identifier when db is available; keep
    // localStorage as a fallback for auth pages that load before data.js.
    setIdentifier(method, value) {
      const s = read(); s.method = method; s.identifier = value; write(s);
      if (window.db) {
        db.update(function (d) { d.auth = d.auth || {}; d.auth.identifier = value; d.auth.method = method; });
      }
    },
    getIdentifier() {
      if (window.db && db.get().auth && db.get().auth.identifier) {
        return { method: db.get().auth.method || 'phone', identifier: db.get().auth.identifier };
      }
      const s = read();
      return { method: s.method || 'phone', identifier: s.identifier || '' };
    },
    setAuthed(v) {
      const s = read(); s.authed = !!v; write(s);
      if (window.db && v) {
        const id = s.identifier || (db.get().auth && db.get().auth.identifier) || '';
        const method = s.method || (db.get().auth && db.get().auth.method) || 'phone';
        db.signIn(id, method);
      } else if (window.db && !v) {
        db.signOut();
      }
    },
    isAuthed() {
      if (window.db) return db.isSignedIn();
      return !!read().authed;
    },
    logout() {
      localStorage.removeItem(KEY);
      if (window.db) db.signOut();
      window.location.href = '1-login.html';
    },
  };
  window.app = app;

  // Reusable modal — used for create-course wizards, settings, host picker, etc.
  app.modal = function (title, bodyHtml, opts) {
    opts = opts || {};
    const bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9000;font-family:Inter,sans-serif;';
    const card = document.createElement('div');
    const w = opts.width || 440;
    card.style.cssText = 'background:#fff;border-radius:14px;padding:22px;width:' + w + 'px;max-width:95vw;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.25);';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
        '<h3 style="font-size:16px;font-weight:700;color:#1a1a2e;margin:0;">' + title + '</h3>' +
        '<button id="m-close" style="border:none;background:none;cursor:pointer;font-size:24px;line-height:1;color:#9ca3af;padding:0;width:28px;height:28px;">×</button>' +
      '</div>' +
      '<div id="m-body" style="font-size:13px;color:#374151;">' + bodyHtml + '</div>' +
      '<div id="m-actions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px;"></div>';
    bd.appendChild(card);
    document.body.appendChild(bd);
    // ESC key dismisses the topmost modal — and ONLY the topmost
    const escHandler = function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', escHandler);
    const close = function () {
      document.removeEventListener('keydown', escHandler);
      bd.remove();
      if (opts.onClose) opts.onClose();
    };
    card.querySelector('#m-close').addEventListener('click', close);
    bd.addEventListener('click', function (e) { if (e.target === bd) close(); });
    const actionsEl = card.querySelector('#m-actions');
    const body = card.querySelector('#m-body');
    (opts.actions || [{ label: 'Close' }]).forEach(function (a) {
      const btn = document.createElement('button');
      btn.style.cssText = 'padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;border:1.5px solid #e5e7eb;background:' + (a.primary ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : '#fff') + ';color:' + (a.primary ? '#fff' : '#1a1a2e') + ';' + (a.primary ? 'border-color:transparent;' : '');
      btn.textContent = a.label;
      btn.addEventListener('click', function () {
        let keepOpen = false;
        if (typeof a.onClick === 'function') keepOpen = a.onClick(body) === false;
        if (!keepOpen) close();
      });
      actionsEl.appendChild(btn);
    });
    return { close: close, body: body };
  };

  // Build a labelled input row (helper for modal forms).
  app.field = function (label, attrs) {
    attrs = attrs || {};
    const id = attrs.id || ('f-' + Math.random().toString(36).slice(2, 7));
    const placeholder = attrs.placeholder || '';
    const value = attrs.value || '';
    const tag = attrs.type === 'select' ? 'select' : (attrs.type === 'textarea' ? 'textarea' : 'input');
    const type = attrs.type === 'select' || attrs.type === 'textarea' ? '' : (' type="' + (attrs.type || 'text') + '"');
    const options = attrs.options || [];
    return '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;margin-top:10px;">' + label + '</label>' +
      (tag === 'select'
        ? '<select id="' + id + '" style="width:100%;border:1.5px solid #e5e7eb;border-radius:6px;padding:8px 12px;font-size:13px;outline:none;background:#fff;font-family:inherit;">' +
            options.map(function (o) { return '<option value="' + (o.value || o) + '">' + (o.label || o) + '</option>'; }).join('') +
          '</select>'
        : tag === 'textarea'
          ? '<textarea id="' + id + '" rows="3" placeholder="' + placeholder + '" style="width:100%;border:1.5px solid #e5e7eb;border-radius:6px;padding:8px 12px;font-size:13px;outline:none;font-family:inherit;resize:vertical;">' + value + '</textarea>'
          : '<input id="' + id + '"' + type + ' placeholder="' + placeholder + '" value="' + value + '" style="width:100%;border:1.5px solid #e5e7eb;border-radius:6px;padding:8px 12px;font-size:13px;outline:none;font-family:inherit;">');
  };

  // Toast helper for inline feedback (replaces alerts).
  app.toast = function (msg) {
    let t = document.querySelector('.app-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'app-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1e2130;color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,0.2);opacity:0;transition:opacity 180ms;font-family:Inter,sans-serif;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.style.opacity = '0'; }, 1800);
  };

  // Wire up an Account/Logout button via EVENT DELEGATION so it survives
  // sidebar re-renders (which were dropping the old click handler). The
  // listener lives on document.body and matches any current/future
  // .sidebar-account element.
  function wireAccount() {
    document.body.addEventListener('click', function (e) {
      const acct = e.target.closest('.sidebar-account');
      if (!acct) return;
      e.preventDefault();
      let menu = document.querySelector('.account-menu');
      if (menu) { menu.remove(); return; }
      menu = document.createElement('div');
      menu.className = 'account-menu';
      menu.style.cssText = 'position:fixed;left:16px;bottom:60px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:6px;z-index:1000;min-width:180px;font-family:Inter,sans-serif;font-size:13px;';
      menu.innerHTML =
        '<button type="button" id="ss-tour" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:none;background:none;border-radius:6px;cursor:pointer;font:inherit;color:#1a1a2e;text-align:left;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>Replay onboarding tour</button>' +
        '<button type="button" id="ss-reset" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:none;background:none;border-radius:6px;cursor:pointer;font:inherit;color:#1a1a2e;text-align:left;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/></svg>Reset demo data</button>' +
        '<div style="height:1px;background:#f3f4f6;margin:4px 0;"></div>' +
        '<button type="button" id="ss-logout" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:none;background:none;border-radius:6px;cursor:pointer;font:inherit;color:#dc2626;text-align:left;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Log out</button>';
      document.body.appendChild(menu);
      menu.querySelector('#ss-tour').addEventListener('click', function () {
        menu.remove();
        if (window.shelly && window.shelly.tour) window.shelly.tour();
      });
      menu.querySelector('#ss-logout').addEventListener('click', function () { app.logout(); });
      menu.querySelector('#ss-reset').addEventListener('click', function () {
        if (confirm('Reset all demo data to the seed?\n\nAny edits will be wiped (added students, top-ups, sent messages).')) {
          if (window.db) window.db.reset();
          window.location.reload();
        }
      });
      const close = (ev) => {
        if (menu.contains(ev.target) || acct.contains(ev.target)) return;
        menu.remove();
        document.removeEventListener('click', close);
      };
      setTimeout(() => document.addEventListener('click', close), 0);
    });
  }

  // Dismiss full-page modals (8/9) on ESC and on backdrop click.
  function wireModalDismiss() {
    // Backdrop = the dark overlay container that wraps the modal box.
    const backdrops = document.querySelectorAll('body > div[style*="rgba(0,0,0"]');
    backdrops.forEach((bd) => {
      bd.addEventListener('click', function (e) {
        if (e.target === bd) {
          // backdrop itself was clicked — go back to course home.
          window.location.href = '6-course-home.html';
        }
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.querySelector('body > div[style*="rgba(0,0,0"]')) {
        window.location.href = '6-course-home.html';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireAccount();
    wireModalDismiss();
  });
})();
