(() => {
  'use strict';

  const STORAGE_KEY_PREFIX = 'cs128_dock_state_';
  const WIDTH_STORAGE_KEY = 'cs128_dock_width_vw';
  let dockedWorkspace = null;
  let activePlaceholder = null;

  // 初始化恢复用户上次保存的分屏宽度
  const savedWidth = localStorage.getItem(WIDTH_STORAGE_KEY);
  if (savedWidth) {
    document.documentElement.style.setProperty('--cs128-dock-width', `${savedWidth}vw`);
  }

  // 直接调用 Ace 实例的 resize(true)，比单纯触发 window resize 更精准快速
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

  // 动态测量顶部导航栏高度
  function updateTopbarHeight() {
    const topbar = document.querySelector('header.topbar-128');
    if (topbar) {
      const h = topbar.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty('--cs128-topbar-h', `${h}px`);
      }
    }
  }

  // 创建左侧边缘拖拽调宽手柄
  function ensureResizer() {
    if (document.getElementById('cs128-dock-resizer')) return;

    const resizer = document.createElement('div');
    resizer.id = 'cs128-dock-resizer';
    resizer.className = 'cs128-dock-resizer';
    resizer.title = '左右拖动调整代码框宽度';
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

  // 获取工作区唯一 ID
  function getWorkspaceId(workspace) {
    const tabContent = workspace.querySelector('.new-core-tab-content[id]');
    if (tabContent) return tabContent.id;
    const block = workspace.closest('section.block[id]');
    return block ? block.id : null;
  }

  // 获取题目名称
  function getActivityTitle(workspace) {
    const frame = workspace.closest('._cs128_core_module_frame');
    const titleEl = frame ? frame.querySelector('.block-title') : null;
    return titleEl ? titleEl.textContent.trim() : '当前题目';
  }

  // 取消右置，放回原位
  function undockWorkspace(clearStorage = true) {
    if (!dockedWorkspace) return;

    const ws = dockedWorkspace;
    ws.classList.remove('cs128-workspace-docked');

    const btn = ws.querySelector('.cs128-dock-toggle-btn');
    if (btn) {
      btn.classList.remove('is-active');
      btn.innerHTML = '<span>◫ 右置代码框</span>';
      btn.title = '将代码框固定在屏幕右侧，方便对照题目编写代码';
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

  // 将指定代码工作区固定到右侧
  function dockWorkspace(workspace, scrollIntoView = true) {
    if (dockedWorkspace === workspace) {
      undockWorkspace(true);
      return;
    }

    if (dockedWorkspace) {
      undockWorkspace(false);
    }

    // 若位于 Additional Practice 折叠面板内，通过原生 Bootstrap API 展开它
    const collapseParent = workspace.closest('.collapse.block-collapse');
    if (collapseParent && !collapseParent.classList.contains('show')) {
      if (window.bootstrap && window.bootstrap.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(collapseParent, { toggle: false }).show();
      } else {
        collapseParent.classList.add('show');
      }
    }

    // 将工作区内部的 History Modal 移至 body 根节点，避免 fixed 层叠上下文遮挡弹窗
    workspace.querySelectorAll('.modal').forEach((modal) => {
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });

    updateTopbarHeight();
    ensureResizer();

    // 在原位置插入虚线占位框
    const title = getActivityTitle(workspace);
    const placeholder = document.createElement('div');
    placeholder.className = 'cs128-dock-placeholder';
    placeholder.innerHTML = `
      <span>📌 <strong>${title}</strong> 的代码框已固定在右侧分屏</span>
      <button type="button" class="btn btn-sm btn-outline-secondary">还原回此处</button>
    `;
    placeholder.querySelector('button').addEventListener('click', () => undockWorkspace(true));
    workspace.parentNode.insertBefore(placeholder, workspace);
    activePlaceholder = placeholder;

    // 激活右置状态
    dockedWorkspace = workspace;
    workspace.classList.add('cs128-workspace-docked');
    document.body.classList.add('cs128-dock-active');

    const btn = workspace.querySelector('.cs128-dock-toggle-btn');
    if (btn) {
      btn.classList.add('is-active');
      btn.innerHTML = '<span>✕ 取消右置</span>';
      btn.title = '将代码框放回原题目下方';
    }

    // 记录状态，防止切换主题重载页面后丢失
    const wsId = getWorkspaceId(workspace);
    if (wsId) {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + location.pathname, wsId);
    }

    // 将左侧题干平滑滚动至视野顶部
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

  // 扫描并绑定所有代码工作区
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
      btn.innerHTML = '<span>◫ 右置代码框</span>';
      btn.title = '将代码框固定在屏幕右侧，方便对照题目编写代码';
      btn.addEventListener('click', () => dockWorkspace(workspace, true));
      tabbar.appendChild(btn);

      // 切换文件 Tab 时重算 Ace 尺寸
      tabbar.querySelectorAll('[data-bs-toggle="pill"]').forEach((tabBtn) => {
        tabBtn.addEventListener('shown.bs.tab', () => {
          if (dockedWorkspace === workspace) resizeAceEditors(workspace);
        });
      });

      // 当 Additional Practice 被折叠收起时，自动退出右置
      const collapseParent = workspace.closest('.collapse.block-collapse');
      if (collapseParent && !collapseParent.dataset.cs128DockBound) {
        collapseParent.addEventListener('hide.bs.collapse', () => {
          if (dockedWorkspace === workspace) undockWorkspace(true);
        });
        collapseParent.dataset.cs128DockBound = 'true';
      }

      // 当点击原生全屏按钮时，先退出右置避免冲突
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

    // 页面重载后自动恢复上次右置的代码框
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