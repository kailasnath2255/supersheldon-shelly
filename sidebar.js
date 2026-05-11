// Renders the app sidebar into <div id="sidebar-root"></div>.
// Active item is determined from body[data-page].
(function () {
  const ICONS = {
    folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'users-2': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    video: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    report: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    msg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    bag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>',
    bar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    account: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  };

  const NAV = [
    { id: 'courses', label: 'Courses', icon: 'folder', href: '5-classes.html', sub: [
      { id: '1on1', label: '1:1 Courses', icon: 'users-2', href: '5-classes.html' },
      { id: 'group', label: 'Group Courses', icon: 'video', href: '10-group-courses.html' },
      { id: 'recorded', label: 'Recorded Courses', icon: 'play', href: '11-recorded-courses.html' },
    ] },
    { id: 'users', label: 'Users', icon: 'users', href: '12-users.html' },
    { id: 'progress', label: 'Progress Reports', icon: 'report', href: '13-progress-reports.html' },
    { id: 'chats', label: 'Chats', icon: 'msg', href: '14-chats.html', badge: true },
    { id: 'store', label: 'Store', icon: 'bag', href: '15-store.html' },
    { id: 'analytics', label: 'Analytics', icon: 'bar', href: '16-analytics.html' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', href: '17-notifications.html' },
  ];

  const COURSE_KIDS = new Set(['courses', '1on1', 'group', 'recorded', 'course-home', 'course-content']);

  function render() {
    const root = document.getElementById('sidebar-root');
    if (!root) return;
    const active = document.body.dataset.page || '';

    let html = '<div class="sidebar">';
    html += '<div class="sidebar-logo">';
    html += '<div class="sidebar-logo-icon" style="background:#fff;overflow:hidden;"><img src="logo.webp" alt="Super Sheldon" style="width:26px;height:26px;object-fit:contain;"></div>';
    html += '<span>Super Sheldon</span>';
    html += '</div>';
    html += '<div class="sidebar-nav">';

    const unreadChats = (window.db && db.unreadChatCount()) || 0;
    const unreadNotifs = (window.db && db.unreadNotifCount()) || 0;
    const me = (window.db && db.get().me) || { name: 'Account', avatar: '' };

    NAV.forEach(function (item) {
      if (item.sub) {
        const cls = COURSE_KIDS.has(active) ? 'nav-item active' : 'nav-item';
        html += '<a class="' + cls + '" href="' + item.href + '">' + ICONS[item.icon] + ' ' + item.label + '</a>';
        item.sub.forEach(function (s) {
          const scls = s.id === active ? 'nav-sub-item active' : 'nav-sub-item';
          html += '<a class="' + scls + '" href="' + s.href + '">' + ICONS[s.icon] + ' ' + s.label + '</a>';
        });
      } else {
        const cls = item.id === active ? 'nav-item active' : 'nav-item';
        let badge = '';
        if (item.id === 'chats' && unreadChats > 0) badge = '<span class="nav-badge" title="' + unreadChats + ' unread"></span>';
        if (item.id === 'notifications' && unreadNotifs > 0) badge = '<span class="nav-badge" title="' + unreadNotifs + ' unread"></span>';
        html += '<a class="' + cls + '" href="' + item.href + '">' + ICONS[item.icon] + ' ' + item.label + badge + '</a>';
      }
    });

    html += '</div>';
    html += '<a class="sidebar-account" href="#" id="sidebar-account-link" title="' + (me.email || '') + '">';
    html += '<div class="account-avatar">' + ICONS.account + '</div>';
    html += '<span class="account-label">' + (me.name || 'Account') + '</span><span class="account-arrow">›</span>';
    html += '</a>';
    html += '</div>';

    root.outerHTML = html;

    // Re-render when db changes (badges update live across the app)
    if (window.db && !window._sidebarSubbed) {
      window._sidebarSubbed = true;
      db.subscribe(function () { render(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
