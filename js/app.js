(function () {
  'use strict';

  // ─── Storage Keys ──────────────────────────────────────────────────────────
  // Requirements 5.1, 5.2: tasks and links are stored under separate keys.
  const TASKS_KEY = 'dashboard_tasks';
  const LINKS_KEY = 'dashboard_links';
  const NAME_KEY  = 'dashboard_name';
  const THEME_KEY = 'dashboard_theme';

  // ─── Storage ───────────────────────────────────────────────────────────────
  // Requirements 5.1 – 5.4
  const Storage = {
    save(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error('[Storage] Could not save "' + key + '":', e);
      }
    },
    load(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return [];
        return JSON.parse(raw);
      } catch (e) {
        console.warn('[Storage] Failed to parse "' + key + '"; resetting to [].', e);
        return [];
      }
    },
  };

  // ─── GreetingWidget ────────────────────────────────────────────────────────
  // Requirements 1.1 – 1.6
  const GreetingWidget = {
    formatTime(date) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return hh + ':' + mm;
    },
    formatDate(date) {
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    },
    getGreeting(hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      if (hour >= 18 && hour <= 21) return 'Good Evening';
      return 'Good Night';
    },
    render() {
      const now = new Date();
      const timeEl    = document.getElementById('greeting-time');
      const dateEl    = document.getElementById('greeting-date');
      const msgEl     = document.getElementById('greeting-message');
      const nameDisp  = document.getElementById('greeting-name-display');
      if (timeEl)   timeEl.textContent   = GreetingWidget.formatTime(now);
      if (dateEl)   dateEl.textContent   = GreetingWidget.formatDate(now);
      if (msgEl)    msgEl.textContent    = GreetingWidget.getGreeting(now.getHours());
      if (nameDisp) {
        const saved = Storage.load(NAME_KEY);
        const name  = Array.isArray(saved) ? '' : (saved || '');
        nameDisp.textContent = name ? name : '';
      }
    },
    init() {
      GreetingWidget.render();
      setInterval(GreetingWidget.tick, 60000);
      // Challenge: Custom name — restore saved name into the input field
      const nameInput = document.getElementById('greeting-name-input');
      if (nameInput) {
        const saved = Storage.load(NAME_KEY);
        const name  = Array.isArray(saved) ? '' : (saved || '');
        nameInput.value = name;
        nameInput.addEventListener('input', function () {
          const val = nameInput.value.trim();
          // Save raw string (not array) under NAME_KEY
          try { localStorage.setItem(NAME_KEY, JSON.stringify(val)); } catch(e) {}
          const nameDisp = document.getElementById('greeting-name-display');
          if (nameDisp) nameDisp.textContent = val;
        });
      }
    },
    tick() {
      GreetingWidget.render();
    },
  };

  // ─── FocusTimer ────────────────────────────────────────────────────────────
  // Requirements 2.1 – 2.7
  const FocusTimer = {
    state: {
      remainingSeconds: 1500,
      isRunning: false,
      isFinished: false,
      intervalId: null,
    },
    formatTime(n) {
      const minutes = Math.floor(n / 60);
      const seconds = n % 60;
      return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    },
    start() {
      if (FocusTimer.state.isRunning) return;
      FocusTimer.state.isRunning = true;
      FocusTimer.state.intervalId = setInterval(FocusTimer.tick, 1000);
    },
    stop() {
      FocusTimer.state.isRunning = false;
      clearInterval(FocusTimer.state.intervalId);
      FocusTimer.state.intervalId = null;
    },
    reset() {
      clearInterval(FocusTimer.state.intervalId);
      FocusTimer.state.intervalId = null;
      FocusTimer.state.remainingSeconds = 1500;
      FocusTimer.state.isRunning = false;
      FocusTimer.state.isFinished = false;
      FocusTimer.render();
    },
    tick() {
      FocusTimer.state.remainingSeconds -= 1;
      if (FocusTimer.state.remainingSeconds <= 0) {
        FocusTimer.state.remainingSeconds = 0;
        FocusTimer.onComplete();
      } else {
        FocusTimer.render();
      }
    },
    onComplete() {
      clearInterval(FocusTimer.state.intervalId);
      FocusTimer.state.intervalId = null;
      FocusTimer.state.isRunning = false;
      FocusTimer.state.isFinished = true;
      FocusTimer.render();
    },
    render() {
      const display = document.getElementById('timer-display');
      if (!display) return;
      display.textContent = FocusTimer.formatTime(FocusTimer.state.remainingSeconds);
      if (FocusTimer.state.isFinished) {
        display.classList.add('timer-finished');
      } else {
        display.classList.remove('timer-finished');
      }
    },
    init() {
      FocusTimer.render();
      const btnStart = document.getElementById('btn-start');
      const btnStop  = document.getElementById('btn-stop');
      const btnReset = document.getElementById('btn-reset');
      if (btnStart) btnStart.addEventListener('click', FocusTimer.start);
      if (btnStop)  btnStop.addEventListener('click', FocusTimer.stop);
      if (btnReset) btnReset.addEventListener('click', FocusTimer.reset);
    },
  };

  // ─── TodoList ──────────────────────────────────────────────────────────────
  // Requirements 3.1 – 3.10
  const TodoList = {
    tasks: [],
    addTask(description) {
      if (description.trim() === '') {
        const form = document.getElementById('todo-form');
        if (form) {
          const existing = form.querySelector('.validation-message');
          if (existing) existing.remove();
          const input = document.getElementById('todo-input');
          const msg = document.createElement('span');
          msg.className = 'validation-message';
          msg.textContent = 'Please enter a task description.';
          if (input && input.parentNode) {
            input.insertAdjacentElement('afterend', msg);
          } else {
            form.appendChild(msg);
          }
          if (input) {
            input.addEventListener('input', function clearMsg() {
              const m = form.querySelector('.validation-message');
              if (m) m.remove();
              input.removeEventListener('input', clearMsg);
            });
          }
        }
        return;
      }
      // Challenge: Prevent duplicate tasks (case-insensitive)
      const descTrimmed = description.trim().toLowerCase();
      const isDuplicate = TodoList.tasks.some(function (t) {
        return t.description.toLowerCase() === descTrimmed;
      });
      if (isDuplicate) {
        const form2 = document.getElementById('todo-form');
        if (form2) {
          const existing = form2.querySelector('.validation-message');
          if (existing) existing.remove();
          const input2 = document.getElementById('todo-input');
          const msg2 = document.createElement('span');
          msg2.className = 'validation-message';
          msg2.textContent = 'Task already exists!';
          if (input2 && input2.parentNode) {
            input2.insertAdjacentElement('afterend', msg2);
          } else {
            form2.appendChild(msg2);
          }
          if (input2) {
            input2.addEventListener('input', function clearMsg2() {
              const m = form2.querySelector('.validation-message');
              if (m) m.remove();
              input2.removeEventListener('input', clearMsg2);
            });
          }
        }
        return;
      }
      const form = document.getElementById('todo-form');
      if (form) {
        const existing = form.querySelector('.validation-message');
        if (existing) existing.remove();
      }
      const task = {
        id: Date.now().toString(),
        description: description.trim(),
        completed: false,
      };
      TodoList.tasks.push(task);
      Storage.save(TASKS_KEY, TodoList.tasks);
      TodoList.render();
    },
    deleteTask(id) {
      TodoList.tasks = TodoList.tasks.filter(function (t) { return t.id !== id; });
      Storage.save(TASKS_KEY, TodoList.tasks);
      TodoList.render();
    },
    toggleComplete(id) {
      const task = TodoList.tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.completed = !task.completed;
      Storage.save(TASKS_KEY, TodoList.tasks);
      TodoList.render();
    },
    editTask(id, newDesc) {
      if (newDesc.trim() === '') {
        const listEl = document.getElementById('todo-list');
        const taskEl = listEl && listEl.querySelector('[data-id="' + id + '"]');
        const container = taskEl || document.getElementById('todo-form');
        if (container) {
          const existing = container.querySelector('.validation-message');
          if (existing) existing.remove();
          const msg = document.createElement('span');
          msg.className = 'validation-message';
          msg.textContent = 'Task description cannot be empty.';
          container.appendChild(msg);
          container.addEventListener('input', function clearMsg() {
            const m = container.querySelector('.validation-message');
            if (m) m.remove();
            container.removeEventListener('input', clearMsg);
          });
        }
        return;
      }
      const task = TodoList.tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.description = newDesc.trim();
      Storage.save(TASKS_KEY, TodoList.tasks);
      TodoList.render();
    },
    render() {
      const list = document.getElementById('todo-list');
      if (!list) return;
      while (list.firstChild) list.removeChild(list.firstChild);
      TodoList.tasks.forEach(function (task) {
        list.appendChild(TodoList.renderTask(task));
      });
    },
    renderTask(task) {
      const li = document.createElement('li');
      li.setAttribute('data-id', task.id);
      if (task.completed) li.classList.add('completed');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', 'Toggle completion');
      checkbox.addEventListener('change', function () {
        TodoList.toggleComplete(task.id);
      });

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.description;

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'task-btn task-btn--edit';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.addEventListener('click', function () {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = task.description;
        li.replaceChild(input, span);
        input.focus();
        input.select();

        let editCommitted = false;
        function saveEdit() {
          if (editCommitted) return;
          editCommitted = true;
          TodoList.editTask(task.id, input.value);
        }
        function cancelEdit() {
          if (editCommitted) return;
          editCommitted = true;
          TodoList.render();
        }
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
          if (e.key === 'Escape') { cancelEdit(); }
        });
        input.addEventListener('blur', saveEdit);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'task-btn task-btn--delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.addEventListener('click', function () {
        TodoList.deleteTask(task.id);
      });

      const actions = document.createElement('div');
      actions.className = 'task-actions';
      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(actions);
      return li;
    },
    init(tasks) {
      TodoList.tasks = Array.isArray(tasks) ? tasks : [];
      TodoList.render();
      const form = document.getElementById('todo-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const input = document.getElementById('todo-input');
          if (!input) return;
          const prevLength = TodoList.tasks.length;
          TodoList.addTask(input.value);
          if (TodoList.tasks.length > prevLength) {
            input.value = '';
          }
        });
      }
    },
  };

  // ─── QuickLinks ───────────────────────────────────────────────────────────
  // Requirements 4.1 – 4.6
  const QuickLinks = {
    links: [],
    addLink(label, url) {
      if (label.trim() === '' || url.trim() === '') {
        const form = document.getElementById('quick-links-form');
        if (form) {
          const existing = form.querySelector('.validation-message');
          if (existing) existing.remove();
          const msg = document.createElement('span');
          msg.className = 'validation-message';
          if (label.trim() === '' && url.trim() === '') {
            msg.textContent = 'Please enter a label and a URL.';
          } else if (label.trim() === '') {
            msg.textContent = 'Please enter a link label.';
          } else {
            msg.textContent = 'Please enter a URL.';
          }
          form.appendChild(msg);
          const labelInput = document.getElementById('link-label-input');
          const urlInput   = document.getElementById('link-url-input');
          function clearMsg() {
            const m = form.querySelector('.validation-message');
            if (m) m.remove();
            if (labelInput) labelInput.removeEventListener('input', clearMsg);
            if (urlInput)   urlInput.removeEventListener('input', clearMsg);
          }
          if (labelInput) labelInput.addEventListener('input', clearMsg);
          if (urlInput)   urlInput.addEventListener('input', clearMsg);
        }
        return;
      }
      const form = document.getElementById('quick-links-form');
      if (form) {
        const existing = form.querySelector('.validation-message');
        if (existing) existing.remove();
      }
      const link = {
        id: Date.now().toString(),
        label: label.trim(),
        url: url.trim(),
      };
      QuickLinks.links.push(link);
      Storage.save(LINKS_KEY, QuickLinks.links);
      QuickLinks.render();
    },
    deleteLink(id) {
      QuickLinks.links = QuickLinks.links.filter(function (l) { return l.id !== id; });
      Storage.save(LINKS_KEY, QuickLinks.links);
      QuickLinks.render();
    },
    /**
     * Open a URL in a new browser tab with security attributes.
     * Requirement 4.3: open Link URL in a new tab; noopener,noreferrer prevents tab-napping.
     *
     * @param {string} url
     */
    openLink(url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    render() {
      const list = document.getElementById('quick-links-list');
      if (!list) return;
      while (list.firstChild) list.removeChild(list.firstChild);
      QuickLinks.links.forEach(function (link) {
        list.appendChild(QuickLinks.renderLink(link));
      });
    },
    renderLink(link) {
      const div = document.createElement('div');
      div.className = 'quick-link-item';
      div.setAttribute('data-id', link.id);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-link-btn';
      btn.textContent = link.label;
      btn.setAttribute('aria-label', 'Open ' + link.label);
      btn.addEventListener('click', function () {
        QuickLinks.openLink(link.url);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'quick-link-delete';
      deleteBtn.textContent = '\u00d7';
      deleteBtn.setAttribute('aria-label', 'Delete ' + link.label);
      deleteBtn.addEventListener('click', function () {
        QuickLinks.deleteLink(link.id);
      });

      div.appendChild(btn);
      div.appendChild(deleteBtn);
      return div;
    },
    init(links) {
      QuickLinks.links = Array.isArray(links) ? links : [];
      QuickLinks.render();
      const form = document.getElementById('quick-links-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const labelInput = document.getElementById('link-label-input');
          const urlInput   = document.getElementById('link-url-input');
          if (!labelInput || !urlInput) return;
          const prevLength = QuickLinks.links.length;
          QuickLinks.addLink(labelInput.value, urlInput.value);
          if (QuickLinks.links.length > prevLength) {
            labelInput.value = '';
            urlInput.value = '';
          }
        });
      }
    },
  };

  // ─── ThemeToggle ──────────────────────────────────────────────────────────
  // Challenge: Light/Dark mode toggle, persisted in localStorage
  const ThemeToggle = {
    DARK: 'dark',
    LIGHT: 'light',
    init() {
      const saved = ThemeToggle._loadTheme();
      ThemeToggle._apply(saved);
      const btn = document.getElementById('btn-theme-toggle');
      if (btn) {
        btn.addEventListener('click', function () {
          const current = document.body.getAttribute('data-theme') || ThemeToggle.LIGHT;
          const next = current === ThemeToggle.DARK ? ThemeToggle.LIGHT : ThemeToggle.DARK;
          ThemeToggle._apply(next);
          ThemeToggle._saveTheme(next);
        });
      }
    },
    _apply(theme) {
      document.body.setAttribute('data-theme', theme);
      const btn = document.getElementById('btn-theme-toggle');
      if (btn) btn.textContent = theme === ThemeToggle.DARK ? '☀️' : '🌙';
    },
    _saveTheme(theme) {
      try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
    },
    _loadTheme() {
      try {
        const t = localStorage.getItem(THEME_KEY);
        return (t === ThemeToggle.DARK || t === ThemeToggle.LIGHT) ? t : ThemeToggle.LIGHT;
      } catch(e) {
        return ThemeToggle.LIGHT;
      }
    },
  };

  // ─── App ──────────────────────────────────────────────────────────────────
  const App = {
    init() {
      const tasks = Storage.load(TASKS_KEY);
      const links = Storage.load(LINKS_KEY);
      ThemeToggle.init();
      TodoList.init(tasks);
      QuickLinks.init(links);
      GreetingWidget.init();
      FocusTimer.init();
    },
  };

  document.addEventListener('DOMContentLoaded', App.init);

  // ─── Test Harness ─────────────────────────────────────────────────────────
  // Expose namespaces and constants for unit and property-based tests.
  // Uses globalThis for compatibility with both browser (window) and
  // Jest/Node test environments.
  var _global = (typeof globalThis !== 'undefined') ? globalThis
              : (typeof window    !== 'undefined') ? window
              : (typeof global    !== 'undefined') ? global
              : this;

  _global.AppTestHarness = {
    Storage,
    TASKS_KEY,
    LINKS_KEY,
    NAME_KEY,
    THEME_KEY,
    GreetingWidget,
    FocusTimer,
    TodoList,
    QuickLinks,
    ThemeToggle,
  };

})();
