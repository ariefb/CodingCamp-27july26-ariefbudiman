# Implementation Plan: Todo List Life Dashboard

## Overview

Build a single-page productivity dashboard using HTML, CSS, and Vanilla JavaScript. All logic lives in `js/app.js` using the IIFE + namespace pattern. Styles in `css/style.css`. Markup in `index.html`. No frameworks, no build tools, no backend.

## Tasks

- [x] 1. Scaffold project structure and HTML boilerplate
  - Create `index.html` with `<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport">`, and links to `css/style.css` and `js/app.js`
  - Create the `css/` and `js/` directories
  - Add semantic HTML structure for all four widget sections: `#greeting-widget`, `#focus-timer`, `#todo-widget`, `#quick-links-widget`
  - Add DOM anchor elements referenced by JS: `#greeting-time`, `#greeting-date`, `#greeting-message`, `#timer-display`, `#todo-list`, `#todo-form`, `#quick-links-list`, `#quick-links-form`
  - _Requirements: 6.1, 6.3_

- [x] 2. Implement CSS foundation and responsive layout
  - [x] 2.1 Write CSS reset, custom properties (variables), and base typography
    - Define `--font-size-base: 14px` (minimum) and a typographic scale via CSS custom properties
    - Apply a CSS reset (box-sizing, margin/padding normalization)
    - _Requirements: 6.2, 6.5_

  - [x] 2.2 Implement CSS Grid dashboard layout with responsive breakpoints
    - Default (≥768px): multi-column grid layout placing widgets side-by-side
    - Below 768px (`@media (max-width: 767px)`): single-column stacked layout
    - _Requirements: 6.6, 6.7_

  - [x] 2.3 Add widget-level styles and visual polish
    - Style each widget card with clear visual separation (border, background, padding, or shadow)
    - Style timer display, todo list items (including `.completed` strikethrough), quick-link buttons
    - Style the `.timer-finished` state on the timer display
    - Style inline validation messages for form inputs
    - _Requirements: 3.7, 2.6, 6.1_

- [x] 3. Implement `Storage` namespace in `js/app.js`
  - Create the IIFE wrapper and define `Storage` with `save(key, data)` and `load(key)`
  - `save`: wraps `localStorage.setItem` + `JSON.stringify` in try/catch (handles `QuotaExceededError`)
  - `load`: wraps `localStorage.getItem` + `JSON.parse` in try/catch; returns `[]` on null or parse error
  - Define constants `TASKS_KEY = "dashboard_tasks"` and `LINKS_KEY = "dashboard_links"`
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [-] 3.1 Write property test for Storage round-trip (tasks) — Property 6
    - **Property 6: Task persistence is a round-trip**
    - Use `fc.array(fc.record({id: fc.string(), description: fc.string().filter(s=>s.trim()!==''), completed: fc.boolean()}))` to generate task arrays
    - Assert `Storage.load(TASKS_KEY)` deeply equals the saved array
    - **Validates: Requirements 3.9, 3.10, 5.1**

  - [-] 3.2 Write property test for Storage round-trip (links) — Property 8
    - **Property 8: Link persistence is a round-trip**
    - Use `fc.array(fc.record({id: fc.string(), label: fc.string().filter(s=>s.trim()!==''), url: fc.string().filter(s=>s.trim()!='')}))` to generate link arrays
    - Assert `Storage.load(LINKS_KEY)` deeply equals the saved array
    - **Validates: Requirements 4.5, 4.6, 5.2**

  - [-] 3.3 Write property test for corrupt storage fallback — Property 10
    - **Property 10: Corrupt storage falls back to empty array**
    - Use `fc.string().filter(s => { try { JSON.parse(s); return false; } catch(e) { return true; } })` for invalid JSON strings
    - Assert `Storage.load(key)` returns `[]` and does not throw
    - **Validates: Requirements 5.3**

- [x] 4. Implement `GreetingWidget` namespace
  - [x] 4.1 Implement `formatTime(date)`, `formatDate(date)`, and `getGreeting(hour)`
    - `formatTime`: return zero-padded `"HH:MM"` string from a `Date`
    - `formatDate`: return human-readable string e.g. `"Thursday, 31 July 2026"` using `toLocaleDateString` or manual formatting
    - `getGreeting`: map hour [0–23] to one of "Good Morning" / "Good Afternoon" / "Good Evening" / "Good Night" per the requirements table
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [~] 4.2 Write property test for `formatTime` — Property 1
    - **Property 1: Time formatting always produces valid HH:MM**
    - Use `fc.date()` → extract hour/minute, call `GreetingWidget.formatTime(date)`
    - Assert result matches `/^\d{2}:\d{2}$/` with HH in [00–23] and MM in [00–59]
    - **Validates: Requirements 1.1**

  - [~] 4.3 Write property test for `getGreeting` — Property 2
    - **Property 2: Greeting correctly maps all hours to greeting strings**
    - Use `fc.integer({min:0, max:23})` for the hour
    - Assert exactly the correct greeting string for each hour range
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

  - [x] 4.4 Implement `GreetingWidget.init()`, `tick()`, and `render()`
    - `render()`: update `#greeting-time`, `#greeting-date`, `#greeting-message` DOM text
    - `init()`: call `render()` once, then `setInterval(tick, 60000)`
    - `tick()`: call `render()` to refresh displayed time and greeting
    - _Requirements: 1.1, 1.2_

- [x] 5. Implement `FocusTimer` namespace
  - [x] 5.1 Implement timer state object and `formatTime(n)` pure function
    - Define state: `{ remainingSeconds: 1500, isRunning: false, isFinished: false, intervalId: null }`
    - `formatTime(n)`: convert integer seconds [0–1500] to `"MM:SS"` string with zero-padding
    - _Requirements: 2.1, 2.7_

  - [~] 5.2 Write property test for `FocusTimer.formatTime` — Property 3
    - **Property 3: Timer formatting always produces valid MM:SS**
    - Use `fc.integer({min:0, max:1500})` for the seconds value
    - Assert result matches `MM:SS` pattern and `(MM * 60) + SS === n`
    - **Validates: Requirements 2.7**

  - [x] 5.3 Implement `start()`, `stop()`, `reset()`, `tick()`, `onComplete()`, and `render()`
    - `start()`: guard against double-start (`if (state.isRunning) return`); set `isRunning = true`; start `setInterval(tick, 1000)`
    - `tick()`: decrement `remainingSeconds`; if 0 call `onComplete()`; else `render()`
    - `stop()`: set `isRunning = false`; `clearInterval`
    - `reset()`: `clearInterval`; restore `remainingSeconds = 1500`, `isRunning = false`, `isFinished = false`; `render()`
    - `onComplete()`: `clearInterval`; set `isFinished = true`; `render()`
    - `render()`: update `#timer-display` text; toggle `.timer-finished` class when `isFinished`
    - Wire Start/Stop/Reset button click handlers to these methods
    - `FocusTimer.init()`: call `render()` to display initial 25:00
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [~] 5.4 Write unit tests for `FocusTimer` state transitions
    - Test: timer initializes at 25:00 (`state.remainingSeconds === 1500`) — Requirement 2.1
    - Test: start + advance N seconds with fake timers → `remainingSeconds` decreases by N — Requirement 2.2
    - Test: stop pauses countdown (value unchanged after stop + advance) — Requirement 2.4
    - Test: reset restores 25:00 — Requirement 2.5
    - Test: timer stops and sets `isFinished = true` at 0:00 — Requirement 2.6

- [x] 6. Implement `TodoList` namespace
  - [x] 6.1 Implement `addTask(description)` and `deleteTask(id)` with persistence
    - `addTask`: validate `description.trim() !== ''`; create Task object with `id = Date.now().toString()`, trimmed description, `completed: false`; push to `tasks[]`; call `Storage.save(TASKS_KEY, tasks)`; call `render()`
    - On empty input: show inline validation message; do not mutate state
    - `deleteTask`: filter out task by id; call `Storage.save`; call `render()`
    - _Requirements: 3.1, 3.2, 3.8, 3.9_

  - [~] 6.2 Write property test for `addTask` growing the list — Property 4
    - **Property 4: Adding a valid task grows the list by one**
    - Use `fc.string().filter(s => s.trim() !== '')` for description
    - Assert list length increases by 1 and new task has trimmed description and `completed === false`
    - **Validates: Requirements 3.1**

  - [~] 6.3 Write property test for blank input rejection — Property 5
    - **Property 5: Task validation rejects blank descriptions for both add and edit**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` for blank strings
    - Assert `addTask(s)` leaves list unchanged and `editTask(id, s)` leaves the task description unchanged
    - **Validates: Requirements 3.2, 3.5**

  - [x] 6.4 Implement `toggleComplete(id)` and `editTask(id, newDesc)`
    - `toggleComplete`: find task by id; flip `completed` boolean; `Storage.save`; `render()`
    - `editTask`: validate `newDesc.trim() !== ''`; find task by id; update `description`; `Storage.save`; `render()`; on empty desc, show inline validation and retain previous description
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.9_

  - [x] 6.5 Write property test for `toggleComplete` being its own inverse — Property 7
    - **Property 7: Completion toggle is its own inverse**
    - Use `fc.boolean()` for initial `completed` state
    - Assert calling `toggleComplete(id)` twice leaves `completed` unchanged; once produces `!original`
    - **Validates: Requirements 3.6**

  - [x] 6.6 Implement `render()` and `renderTask(task)` with full DOM output
    - `render()`: clear `#todo-list`; iterate `tasks[]`; append `renderTask(task)` for each
    - `renderTask(task)`: return a `<li>` with checkbox (completion toggle), description text (`textContent`), edit button, delete button; add `.completed` class when `task.completed === true`
    - Inline validation message cleared on next valid submit or on `input` event
    - _Requirements: 3.7, 6.1_

  - [x] 6.7 Implement `TodoList.init(tasks)` and wire form submit handler
    - `init(tasks)`: store loaded tasks array; call `render()`
    - Wire `#todo-form` submit event: call `addTask(inputValue)`; clear input on success
    - _Requirements: 3.10_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement `QuickLinks` namespace
  - [x] 8.1 Implement `addLink(label, url)` and `deleteLink(id)` with persistence
    - `addLink`: validate both `label.trim()` and `url.trim()` non-empty; create Link object with `id = Date.now().toString()`; push to `links[]`; `Storage.save(LINKS_KEY, links)`; `render()`
    - On empty label or URL: show inline validation message; do not mutate state
    - `deleteLink`: filter out link by id; `Storage.save`; `render()`
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 8.2 Write property test for `addLink` growing the list — Property 9
    - **Property 9: Adding a valid link grows the list by one**
    - Use `fc.string().filter(s => s.trim() !== '')` for both label and url
    - Assert list length increases by 1 and new link has trimmed label and url
    - **Validates: Requirements 4.1**

  - [x] 8.3 Implement `openLink(url)` and `render()` / `renderLink(link)`
    - `openLink(url)`: call `window.open(url, '_blank', 'noopener,noreferrer')`
    - `render()`: clear `#quick-links-list`; iterate `links[]`; append `renderLink(link)` for each
    - `renderLink(link)`: return a `<div>` with a button (label via `textContent`, click → `openLink`) and a delete button
    - _Requirements: 4.3, 4.4, 6.1_

  - [x] 8.4 Write unit test for `openLink` calling `window.open` correctly
    - Mock `window.open`; call `QuickLinks.openLink(url)`
    - Assert called with `(url, '_blank', 'noopener,noreferrer')`
    - **Validates: Requirements 4.3**

  - [x] 8.5 Implement `QuickLinks.init(links)` and wire form submit handler
    - `init(links)`: store loaded links array; call `render()`
    - Wire `#quick-links-form` submit event: call `addLink(labelValue, urlValue)`; clear inputs on success
    - _Requirements: 4.6_

- [x] 9. Implement `App` bootstrap and wire all widgets
  - Define `App.init()`: load tasks via `Storage.load(TASKS_KEY)`, load links via `Storage.load(LINKS_KEY)`, then call `TodoList.init(tasks)`, `QuickLinks.init(links)`, `GreetingWidget.init()`, `FocusTimer.init()` in that order
  - Register `document.addEventListener('DOMContentLoaded', App.init)`
  - Verify all widget DOM references (`getElementById` / `querySelector`) exist in `index.html`
  - _Requirements: 5.1, 5.2, 6.1, 6.4_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design has a full Correctness Properties section — property-based tests use [fast-check](https://github.com/dubzzz/fast-check)
- Unit tests use Jest or Vitest with fake timers for the FocusTimer
- All user-supplied text must use `element.textContent` (never `innerHTML`) to prevent XSS
- Link buttons must use `window.open(url, '_blank', 'noopener,noreferrer')` to prevent tab-napping
- Storage keys: `"dashboard_tasks"` and `"dashboard_links"` (separate keys per Requirement 5.2)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["2.3", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["4.1", "4.4", "5.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.2", "5.3", "6.1"] },
    { "id": 4, "tasks": ["5.4", "6.2", "6.3", "6.4", "8.1"] },
    { "id": 5, "tasks": ["6.5", "6.6", "8.2", "8.3"] },
    { "id": 6, "tasks": ["6.7", "8.4", "8.5"] },
    { "id": 7, "tasks": ["9.0"] }
  ]
}
```
