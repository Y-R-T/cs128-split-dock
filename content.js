(() => {
  'use strict';

  const STORAGE_KEY_PREFIX = 'cs128_dock_state_';
  const WIDTH_STORAGE_KEY = 'cs128_dock_width_vw';
  let dockedWorkspace = null;
  let activePlaceholder = null;

  /* 1. 多语言字典定义 */
  const I18N = {
    en: {
      dockBtn: '◫ Dock Right',
      dockTitle: 'Dock code editor to the right side for split-screen view',
      undockBtn: '✕ Undock',
      undockTitle: 'Restore code editor to its original position below the problem',
      resizerTitle: 'Drag left/right to resize code panel width',
      defaultActivityTitle: 'Current Activity',
      placeholderMsg: (title) => `📌 <strong>${title}</strong> workspace is docked to the right panel`,
      restoreBtn: 'Restore Here',
    },
    'zh-CN': {
      dockBtn: '◫ 右置代码框',
      dockTitle: '将代码框固定在屏幕右侧，方便对照题目编写代码',
      undockBtn: '✕ 取消右置',
      undockTitle: '将代码框放回原题目下方',
      resizerTitle: '左右拖动调整代码框宽度',
      defaultActivityTitle: '当前题目',
      placeholderMsg: (title) => `📌 <strong>${title}</strong> 的代码框已固定在右侧分屏`,
      restoreBtn: '还原回此处',
    },
    'zh-TW': {
      dockBtn: '◫ 右置程式碼',
      dockTitle: '將程式碼區塊固定在螢幕右側，方便對照題目編寫',
      undockBtn: '✕ 取消右置',
      undockTitle: '將程式碼區塊放回原題目下方',
      resizerTitle: '左右拖曳調整程式碼區塊寬度',
      defaultActivityTitle: '目前題目',
      placeholderMsg: (title) => `📌 <strong>${title}</strong> 的程式碼區塊已固定在右側分割畫面`,
      restoreBtn: '還原回此處',
    },
  };

  /* 2. 根据浏览器首选请求语言匹配语言包 */
  function getLocaleStrings() {
    const lang = (
      navigator.language ||
      (navigator.languages && navigator.languages[0]) ||
      'en'
    ).toLowerCase();

    if (
      lang.startsWith('zh-tw') ||
      lang.startsWith('zh-hk') ||
      lang.startsWith('zh-mo') ||
      lang.includes('hant')
    ) {
      return I18N['zh-TW'];
    }
    if (lang.startsWith('zh')) {
      return I18N['zh-CN'];
    }
    return I18N.en;
  }

  const t = getLocaleStrings();

  /* 3. 转义 HTML 特殊字符 */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 4. 初始化恢复用户上次保存的分屏宽度 */
  const savedWidth = localStorage.getItem(WIDTH_STORAGE_KEY);
  if (savedWidth) {
    document.documentElement.style.setProperty('--cs128-dock-width', `${savedWidth}vw`);
  }

  /* 5. 调用 Ace 实例的 resize(true) */
  function resizeAceEditors(scopeEl = document) {
    requestAnimationFrame(() => {
      if (window.ace && typeof window.ace.edit === 'function') {
        scopeEl.querySelectorAll('.ace_editor').forEach((el) => {
          try {
            window.ace.edit(el).resize(true);
          } catch (_) {}
        });
      }
      window.dispatchEvent(new Event('resize'));
    });
  }

  /* 6. 动态测量顶部导航栏高度 */
  function updateTopbarHeight() {
    const topbar = document.querySelector('header.topbar-128');
    if (topbar) {
      const h = topbar.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty('--cs128-topbar-h', `${h}px`);
      }
    }
  }

  /* 7. 创建左侧边缘拖拽调宽手柄 */
  function ensureResizer() {
    if (document.getElementById('cs128-dock-resizer')) return;

    const resizer = document.createElement('div');
    resizer.id = 'cs128-dock-resizer';
    resizer.className = 'cs128-dock-resizer';
    resizer.title = t.resizerTitle;
    document.body.appendChild(resizer);

    let isDragging = false;

    resizer.addEventListener('mousedown', (e) => {
      isDragging = true;
      resizer.classList.add('is-dragging');
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const vw = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      const clampedVw = Math.min(68, Math.max(30, vw));
      document.documentElement.style.setProperty('--cs128-dock-width', `${clampedVw.toFixed(1)}vw`);
      localStorage.setItem(WIDTH_STORAGE_KEY, clampedVw.toFixed(1));
      if (dockedWorkspace) resizeAceEditors(dockedWorkspace);
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      resizer.classList.remove('is-dragging');
      document.body.style.userSelect = '';
      if (dockedWorkspace) resizeAceEditors(dockedWorkspace);
    });
  }

  /* 8. 获取工作区唯一 ID */
  function getWorkspaceId(workspace) {
    const tabContent = workspace.querySelector('.new-core-tab-content[id]');
    if (tabContent) return tabContent.id;
    const block = workspace.closest('section.block[id]');
    return block ? block.id : null;
  }

  /* 9. 获取题目名称 */
  function getActivityTitle(workspace) {
    const frame = workspace.closest('._cs128_core_module_frame');
    const titleEl = frame ? frame.querySelector('.block-title') : null;
    return titleEl ? titleEl.textContent.trim() : t.defaultActivityTitle;
  }

  /* 10. 取消右置，放回原位 */
  function undockWorkspace(clearStorage = true) {
    if (!dockedWorkspace) return;

    const ws = dockedWorkspace;
    ws.classList.remove('cs128-workspace-docked');

    const btn = ws.querySelector('.cs128-dock-toggle-btn');
    if (btn) {
      btn.classList.remove('is-active');
      btn.innerHTML = `<span>${t.dockBtn}</span>`;
      btn.title = t.dockTitle;
    }

    if (activePlaceholder && activePlaceholder.parentNode) {
      activePlaceholder.parentNode.removeChild(activePlaceholder);
    }
    activePlaceholder = null;
    dockedWorkspace = null;

    document.body.classList.remove('cs128-dock-active');

    if (clearStorage) {
      sessionStorage.removeItem(STORAGE_KEY_PREFIX + location.pathname);
    }

    resizeAceEditors(ws);
  }

  /* 11. 将指定代码工作区固定到右侧 */
  function dockWorkspace(workspace, scrollIntoView = true) {
    if (dockedWorkspace === workspace) {
      undockWorkspace(true);
      return;
    }

    if (dockedWorkspace) {
      undockWorkspace(false);
    }

    const collapseSection = workspace.closest('.collapse.block-collapse');
    if (collapseSection && !collapseSection.classList.contains('show')) {
      if (window.bootstrap && window.bootstrap.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(collapseSection, { toggle: false }).show();
      } else {
        collapseSection.classList.add('show');
      }
    }

    workspace.querySelectorAll('.modal').forEach((modal) => {
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });

    updateTopbarHeight();
    ensureResizer();

    const safeTitle = escapeHtml(getActivityTitle(workspace));
    const placeholder = document.createElement('div');
    placeholder.className = 'cs128-dock-placeholder';
    placeholder.innerHTML = `
      <span>${t.placeholderMsg(safeTitle)}</span>
      <button type="button" class="btn btn-sm btn-outline-secondary">${t.restoreBtn}</button>
    `;
    placeholder.querySelector('button').addEventListener('click', () => undockWorkspace(true));
    workspace.parentNode.insertBefore(placeholder, workspace);
    activePlaceholder = placeholder;

    dockedWorkspace = workspace;
    workspace.classList.add('cs128-workspace-docked');
    document.body.classList.add('cs128-dock-active');

    const btn = workspace.querySelector('.cs128-dock-toggle-btn');
    if (btn) {
      btn.classList.add('is-active');
      btn.innerHTML = `<span>${t.undockBtn}</span>`;
      btn.title = t.undockTitle;
    }

    const wsId = getWorkspaceId(workspace);
    if (wsId) {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + location.pathname, wsId);
    }

    if (scrollIntoView) {
      const section = workspace.closest('section.block--activity, section.block--runnable');
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.5) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }

    resizeAceEditors(workspace);
  }

  /* 12. 扫描并绑定所有代码工作区 */
  function initWorkspaces() {
    const tabbars = document.querySelectorAll(
      '.activity-workspace .new-core-tabbar, .activity-light .new-core-tabbar'
    );

    tabbars.forEach((tabbar) => {
      if (tabbar.querySelector('.cs128-dock-toggle-btn')) return;

      const workspace = tabbar.closest('.activity-workspace') || tabbar.closest('.activity-light');
      if (!workspace) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cs128-dock-toggle-btn';
      btn.innerHTML = `<span>${t.dockBtn}</span>`;
      btn.title = t.dockTitle;
      btn.addEventListener('click', () => dockWorkspace(workspace, true));
      tabbar.appendChild(btn);

      tabbar.querySelectorAll('[data-bs-toggle="pill"]').forEach((tabBtn) => {
        tabBtn.addEventListener('shown.bs.tab', () => {
          if (dockedWorkspace === workspace) resizeAceEditors(workspace);
        });
      });

      const collapseContainer = workspace.closest('.collapse.block-collapse');
      if (collapseContainer && !collapseContainer.dataset.cs128DockBound) {
        collapseContainer.addEventListener('hide.bs.collapse', () => {
          if (dockedWorkspace === workspace) undockWorkspace(true);
        });
        collapseContainer.dataset.cs128DockBound = 'true';
      }

      const frame = workspace.closest('._cs128_core_module_frame');
      const expandBtn = frame ? frame.querySelector('.core-expand-btn') : null;
      if (expandBtn && !expandBtn.dataset.cs128DockBound) {
        expandBtn.addEventListener(
          'click',
          () => {
            if (dockedWorkspace === workspace) undockWorkspace(true);
          },
          true
        );
        expandBtn.dataset.cs128DockBound = 'true';
      }
    });

    const savedWsId = sessionStorage.getItem(STORAGE_KEY_PREFIX + location.pathname);
    if (savedWsId && !dockedWorkspace) {
      const targetTabContent = document.getElementById(savedWsId);
      const ws = targetTabContent
        ? targetTabContent.closest('.activity-workspace') || targetTabContent.closest('.activity-light')
        : null;
      if (ws) {
        dockWorkspace(ws, false);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkspaces);
  } else {
    initWorkspaces();
  }

  document.addEventListener('turbolinks:load', initWorkspaces);
  document.addEventListener('turbolinks:before-visit', () => undockWorkspace(false));
  window.addEventListener('resize', updateTopbarHeight);
})();