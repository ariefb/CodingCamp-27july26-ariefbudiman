# Design Document

## Todo List Life Dashboard

---

## Overview

The Todo List Life Dashboard is a single-page, client-side web application built with plain HTML, CSS, and Vanilla JavaScript — no frameworks, no build tools, no backend. It runs entirely in the browser, persists all user data in `localStorage`, and loads instantly without any network activity after the initial page load.

The application combines four productivity widgets on one screen:

1. **Greeting Widget** — live clock, date, and time-of-day greeting
2. **Focus Timer** — 25-minute countdown (Pomodoro-style)
3. **To-Do List** — task management with add, edit, complete, and delete
4. **Quick Links** — user-defined URL shortcut buttons

The design prioritizes simplicity and zero dependencies. All logic is contained in a single JS module file; all styling in a single CSS file; all markup in a single HTML file.

---

## Architecture

### File Structure

```
project-root/
├── index.html          # Single HTML file — markup for all four widgets
├── css/
│   └── style.css       # All styling, including responsive grid and widget themes
└── js/
    └── app.js          # All application logic — state, storage, rendering, event handling
```

### Architectural Pattern: Module-per-concern inside a single file

Because there is no module bundler, `app.js` uses the **Immediately Invoked Function Expression (IIFE)** pattern to avoid polluting the global scope. Inside the IIFE, logic is organized into named object literals that act as namespaces:

```
app.js
├── Storage        — read/write localStorage with safe JSON parsing
├── GreetingWidget — clock/date formatting, greeting selection
├── FocusTimer     — countdown state machine, interval management
├── TodoList       — task CRUD, rendering
├── QuickLinks     — link CRUD, rendering
└── App            — initialization, wires up all widgets on DOMContentLoaded
```

This approach keeps a clear separation of concerns while staying within the constraint of a single JS file.

### Data Flow

```
User interaction
      │
      ▼
Event listener (in widget namespace)
      │
      ▼
State mutation (in-memory array or scalar)
      │
      ├──▶ Storage.save(key, data)   ──▶ localStorage.setItem
      │
      └──▶ render()                  ──▶ DOM update
```

There is no virtual DOM, no reactivity framework. Each mutation is followed by a targeted re-render of only the affected widget's DOM subtree.

### Initialization Sequence

```
DOMContentLoaded
      │
      ├── Storage.load(TASKS_KEY)  ──▶ TodoList.init(tasks)
      ├── Storage.load(LINKS_KEY)  ──▶ QuickLinks.init(links)
      ├── GreetingWidget.init()    ──▶ starts clock interval
      └── FocusTimer.init()        ──▶ renders initial 25:00 state
```

---

## Components and Interfaces

### Storage

Responsible for all `localStorage` interaction. Isolates JSON serialization and error handling so no other component touches `localStorage` directly.

```js
Storage = {
  save(key, data)   // JSON.stringify(data) and write to localStorage[key]
  load(key)         // JSON.parse(localStorage[key]); return [] on error or missing
}
```

- `save` is called after every mutation (add, edit, toggle, delete).
- `load` returns an empty array (never throws) when the stored value is missing or corrupt.

**Storage keys:**

| Constant        | Value                       | Data stored              |
|-----------------|-----------------------------|--------------------------|
| `TASKS_KEY`     | `"dashboard_tasks"`         | Array of Task objects    |
| `LINKS_KEY`     | `"dashboard_links"`         | Array of Link objects    |

---

### GreetingWidget

Displays the current time, date, and a contextual greeting. No persistent state — always derived from `new Date()`.

```js
GreetingWidget = {
  init()                        // render once, then start setInterval(tick, 60000)
  tick()                        // called every 60 s; re-renders time and greeting
  formatTime(date)  → string    // "HH:MM"
  formatDate(date)  → string    // "Thursday, 31 July 2026"
  getGreeting(hour) → string    // "Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night"
  render()                      // updates #greeting-time, #greeting-date, #greeting-message DOM nodes
}
```

**Greeting mapping:**

| Hour range  | Greeting       |
|-------------|----------------|
| 05 – 11     | Good Morning   |
| 12 – 17     | Good Afternoon |
| 18 – 21     | Good Evening   |
| 22 – 04     | Good Night     |

---

### FocusTimer

A countdown state machine. State is held in a plain object local to the `FocusTimer` namespace.

```js
FocusTimer = {
  init()         // render initial state
  start()        // set isRunning = true; start setInterval(tick, 1000)
  stop()         // set isRunning = false; clearInterval
  reset()        // clearInterval; set remainingSeconds = 1500; isRunning = false; render
  tick()         // decrement remainingSeconds; if 0, call onComplete(); else render
  onComplete()   // clearInterval; set isFinished = true; render
  formatTime(n)  // integer seconds → "MM:SS" string
  render()       // update #timer-display DOM node; toggle finished class
}
```

**Timer state object:**

```js
{
  remainingSeconds: 1500,   // 25 * 60
  isRunning:        false,
  isFinished:       false,
  intervalId:       null
}
```

---

### TodoList

Manages an in-memory array of Task objects plus their DOM representation.

```js
TodoList = {
  init(tasks)              // load initial state; render
  addTask(description)     // validate; push to tasks[]; save; render
  editTask(id, newDesc)    // validate; find by id; update description; save; render
  toggleComplete(id)       // find by id; flip completed; save; render
  deleteTask(id)           // filter out id; save; render
  render()                 // rebuild #todo-list DOM from tasks[]
  renderTask(task)         // returns a <li> DOM element for one task
}
```

**Task object:**

```js
{
  id:          string,    // crypto.randomUUID() or Date.now().toString()
  description: string,    // non-empty, trimmed
  completed:   boolean    // default false
}
```

---

### QuickLinks

Manages an in-memory array of Link objects plus their DOM representation.

```js
QuickLinks = {
  init(links)              // load initial state; render
  addLink(label, url)      // validate both non-empty; push to links[]; save; render
  deleteLink(id)           // filter out id; save; render
  render()                 // rebuild #quick-links-list DOM from links[]
  renderLink(link)         // returns a <div> with button + delete control for one link
  openLink(url)            // window.open(url, '_blank', 'noopener,noreferrer')
}
```

**Link object:**

```js
{
  id:    string,   // crypto.randomUUID() or Date.now().toString()
  label: string,   // non-empty, trimmed
  url:   string    // non-empty, trimmed (no URL validation beyond non-empty)
}
```

---

### App (Bootstrap)

```js
App = {
  init()   // called on DOMContentLoaded; initializes all widgets in order
}

document.addEventListener('DOMContentLoaded', App.init);
```

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string}  id          - Unique identifier (UUID or timestamp string)
 * @property {string}  description - Non-empty task text (trimmed)
 * @property {boolean} completed   - Whether the task has been marked done
 */
```

Stored as a JSON array under `localStorage["dashboard_tasks"]`.

Example:

```json
[
  { "id": "1722408000000", "description": "Review pull requests", "completed": false },
  { "id": "1722408060000", "description": "Write unit tests",    "completed": true  }
]
```

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} id    - Unique identifier
 * @property {string} label - Button display text (non-empty, trimmed)
 * @property {string} url   - Target URL (non-empty, trimmed)
 */
```

Stored as a JSON array under `localStorage["dashboard_links"]`.

Example:

```json
[
  { "id": "1722408100000", "label": "GitHub", "url": "https://github.com" },
  { "id": "1722408200000", "label": "Notion", "url": "https://notion.so"  }
]
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before writing properties, redundancy was assessed:

- Requirements 1.3, 1.4, 1.5, 1.6 all describe a single `getGreeting(hour)` mapping — they are combined into **one property** (Property 2).
- Requirements 3.9 and 3.10 both describe the task persistence round-trip — combined into one property (Property 6).
- Requirements 4.5 and 4.6 both describe the link persistence round-trip — combined into one property (Property 8).
- Requirements 3.4 and 3.5 together define the full contract of `editTask` validation — combined into one property (Property 5).

---

### Property 1: Time formatting always produces valid HH:MM

*For any* valid `Date` object, `GreetingWidget.formatTime(date)` SHALL return a string that matches the pattern `HH:MM` where `HH` is a zero-padded integer in [00–23] and `MM` is a zero-padded integer in [00–59].

**Validates: Requirements 1.1**

---

### Property 2: Greeting correctly maps all hours to greeting strings

*For any* integer `hour` in [0–23], `GreetingWidget.getGreeting(hour)` SHALL return exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night" — specifically:
- "Good Morning" if `hour` is in [5–11]
- "Good Afternoon" if `hour` is in [12–17]
- "Good Evening" if `hour` is in [18–21]
- "Good Night" if `hour` is in [22–23] or [0–4]

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 3: Timer formatting always produces valid MM:SS

*For any* integer `n` in [0–1500], `FocusTimer.formatTime(n)` SHALL return a string matching `MM:SS` where `MM` is a zero-padded minutes value and `SS` is a zero-padded seconds value, such that `(MM * 60) + SS === n`.

**Validates: Requirements 2.7**

---

### Property 4: Adding a valid task grows the list by one

*For any* task list state and any string `description` where `description.trim()` is non-empty, calling `TodoList.addTask(description)` SHALL increase the task list length by exactly 1 and the newly added task SHALL have `description === description.trim()` and `completed === false`.

**Validates: Requirements 3.1**

---

### Property 5: Task validation rejects blank descriptions for both add and edit

*For any* string `s` where `s.trim() === ''` (empty string or pure whitespace):
- `TodoList.addTask(s)` SHALL leave the task list unchanged.
- `TodoList.editTask(id, s)` SHALL leave the targeted task's description unchanged.

**Validates: Requirements 3.2, 3.5**

---

### Property 6: Task persistence is a round-trip

*For any* array of Task objects, calling `Storage.save(TASKS_KEY, tasks)` followed immediately by `Storage.load(TASKS_KEY)` SHALL return an array deeply equal to the original `tasks` array.

**Validates: Requirements 3.9, 3.10, 5.1**

---

### Property 7: Completion toggle is its own inverse

*For any* task with a given `completed` value, calling `TodoList.toggleComplete(id)` twice SHALL leave `task.completed` unchanged (round-trip). Calling it once SHALL produce `task.completed === !original`.

**Validates: Requirements 3.6**

---

### Property 8: Link persistence is a round-trip

*For any* array of Link objects, calling `Storage.save(LINKS_KEY, links)` followed immediately by `Storage.load(LINKS_KEY)` SHALL return an array deeply equal to the original `links` array.

**Validates: Requirements 4.5, 4.6, 5.2**

---

### Property 9: Adding a valid link grows the list by one

*For any* links list state and any pair of strings `(label, url)` where both `label.trim()` and `url.trim()` are non-empty, calling `QuickLinks.addLink(label, url)` SHALL increase the links list length by exactly 1 and the new link SHALL have `label === label.trim()` and `url === url.trim()`.

**Validates: Requirements 4.1**

---

### Property 10: Corrupt storage falls back to empty array

*For any* string `s` that is not valid JSON (i.e., `JSON.parse(s)` would throw), when `s` is stored in `localStorage` under a known key and `Storage.load(key)` is called, the result SHALL be an empty array and no exception SHALL propagate.

**Validates: Requirements 5.3**

---

## Error Handling

### Input Validation

Both `TodoList` and `QuickLinks` perform client-side validation before mutating state:

- **Empty / whitespace-only input**: Detected with `value.trim() === ''`. An inline validation message is inserted adjacent to the input field and the operation is aborted. No state is mutated; no storage write occurs.
- **Validation message lifecycle**: The message is cleared on the next valid submission or when the user begins typing in the field (via `input` event listener).

### Storage Errors

`Storage.load` wraps `JSON.parse` in a `try/catch`:

```js
load(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Storage] Failed to parse "${key}"; resetting to [].`, e);
    return [];
  }
}
```

`Storage.save` also wraps `localStorage.setItem` to handle the rare `QuotaExceededError`:

```js
save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[Storage] Could not save "${key}":`, e);
  }
}
```

### Timer Edge Cases

- The timer's `tick()` function checks `remainingSeconds > 0` before decrementing. When it reaches 0, `clearInterval` is called before any render to prevent off-by-one rendering.
- Calling `start()` while already running is a no-op (guard: `if (state.isRunning) return`).
- Calling `reset()` always clears the interval regardless of `isRunning` state.

### DOM Safety

- All user-supplied text (task descriptions, link labels) is inserted using `element.textContent = value` rather than `innerHTML` to prevent XSS.
- Link URLs are set via `anchor.href = url`. The `openLink` function passes `'noopener,noreferrer'` to `window.open` to prevent tab-napping.

---

## Testing Strategy

### Approach

The application uses a **dual testing approach**:

1. **Property-based tests** — verify universal invariants across randomly generated inputs using [fast-check](https://github.com/dubzzz/fast-check) (JavaScript PBT library).
2. **Example-based unit tests** — verify specific behaviors, edge cases, and side-effect interactions using [Jest](https://jestjs.io/) (or Vitest as a lightweight alternative).

Both test types target the pure logic functions exported from `app.js`. To enable testability, pure functions (`formatTime`, `formatDate`, `getGreeting`, `Storage.load`, `Storage.save`, validation logic) should be extractable — either via `export` if the file is loaded as an ES module in tests, or by attaching them to a `window.AppTestHarness` object for browser-based test runners.

### Property-Based Tests (fast-check)

Each property test runs a **minimum of 100 iterations**. Each test is tagged with a comment referencing the design property it validates.

| Test | Property | fast-check Arbitraries |
|------|----------|------------------------|
| Time format validity | Property 1 | `fc.date()` → extract hour/minute, call `formatTime` |
| Greeting hour mapping | Property 2 | `fc.integer({min:0, max:23})` |
| Timer MM:SS formatting | Property 3 | `fc.integer({min:0, max:1500})` |
| Add valid task grows list | Property 4 | `fc.string().filter(s => s.trim() !== '')` + task array |
| Blank input rejected | Property 5 | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| Task persistence round-trip | Property 6 | `fc.array(fc.record({id: fc.string(), description: fc.string().filter(s=>s.trim()!==''), completed: fc.boolean()}))` |
| Toggle is own inverse | Property 7 | `fc.boolean()` for initial `completed` state |
| Link persistence round-trip | Property 8 | `fc.array(fc.record({id: fc.string(), label: fc.string().filter(s=>s.trim()!==''), url: fc.string().filter(s=>s.trim()!='')}))` |
| Add valid link grows list | Property 9 | `fc.string().filter(s => s.trim() !== '')` for label and url |
| Corrupt storage returns empty | Property 10 | `fc.string().filter(s => { try { JSON.parse(s); return false; } catch(e) { return true; } })` |

**Tag format for each test:**
```js
// Feature: todo-list-life-dashboard, Property N: <property_text>
```

### Example-Based Unit Tests (Jest / Vitest)

| Test | Requirement | What is verified |
|------|-------------|------------------|
| Timer initializes at 25:00 | 2.1 | `state.remainingSeconds === 1500` |
| Start → advance N seconds → remainingSeconds decreases by N | 2.2 | Uses fake timers (`jest.useFakeTimers()`) |
| Stop pauses countdown | 2.4 | Value unchanged after stop + advance |
| Reset restores 25:00 | 2.5 | `state.remainingSeconds === 1500` after reset |
| Timer stops at 0:00 | 2.6 | `state.isFinished === true`, interval cleared |
| Edit task enters edit mode | 3.3 | Task enters editing state |
| Link button calls window.open with correct args | 4.3 | Mock `window.open`; assert called with `(url, '_blank', 'noopener,noreferrer')` |
| Tasks and links use separate storage keys | 5.1, 5.2 | `TASKS_KEY !== LINKS_KEY` |

### Manual / Visual Testing

The following aspects require manual verification in each target browser (Chrome, Firefox, Edge, Safari):

- Four-widget grid layout at ≥768px and single-column below 768px (Requirements 6.6, 6.7)
- Minimum 14px body font size (Requirement 6.2)
- Cross-browser rendering without layout errors (Requirement 6.5)
- Load time under 2 seconds (Requirement 6.4)
- Completed task strikethrough rendering (Requirement 3.7)

### Running Tests

```bash
# Install test dependencies (dev only, not required for the app itself)
npm install --save-dev jest fast-check

# Run all tests once (no watch mode)
npx jest --testPathPattern="app.test.js" --no-coverage
```

Or with Vitest:

```bash
npm install --save-dev vitest fast-check
npx vitest run
```
