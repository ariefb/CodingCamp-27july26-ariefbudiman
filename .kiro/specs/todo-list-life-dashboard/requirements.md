# Requirements Document

## Introduction

The Todo List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity dashboard in the browser, combining a live greeting with time/date display, a focus timer, a to-do list manager, and a quick-links launcher. All data is persisted using the browser's Local Storage API — no backend server or build tooling required. The app must work as a standalone web page or browser extension in all modern browsers (Chrome, Firefox, Edge, Safari).

## Glossary

- **Dashboard**: The single-page web application that hosts all four widgets.
- **Greeting_Widget**: The area of the Dashboard that shows the current time, date, and a contextual greeting message.
- **Focus_Timer**: The countdown timer widget with a fixed 25-minute duration.
- **Todo_List**: The widget that manages user-defined tasks.
- **Task**: A single item in the Todo_List, consisting of a text description and a completion state.
- **Quick_Links**: The widget that renders user-defined shortcut buttons linking to external URLs.
- **Link**: A single entry in Quick_Links, consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari in their current stable release.

---

## Requirements

### Requirement 1: Live Greeting Display

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the Dashboard, so that I am immediately oriented to the current moment without opening another app.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every 60 seconds.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Thursday, 31 July 2026").
3. WHEN the current hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the current hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the current hour is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the current hour is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can use the Pomodoro technique to stay focused during work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down by one second per second.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current value.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed value to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop counting and display a visual indication that the session has ended.
7. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 3: Task Management (To-Do List)

**User Story:** As a user, I want to add, edit, mark as complete, and delete tasks, so that I can track my daily work items directly from the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task description, THE Todo_List SHALL add a new Task with the provided description and a default state of incomplete.
2. IF the user submits an empty task description, THEN THE Todo_List SHALL reject the submission and display an inline validation message.
3. WHEN the user activates the edit control for a Task, THE Todo_List SHALL allow the user to modify the Task's description text.
4. WHEN the user confirms an edit with a non-empty description, THE Todo_List SHALL save the updated description and exit edit mode.
5. IF the user confirms an edit with an empty description, THEN THE Todo_List SHALL reject the edit and retain the previous description.
6. WHEN the user activates the completion toggle for a Task, THE Todo_List SHALL change the Task's state from incomplete to complete, or from complete to incomplete.
7. WHEN a Task is in the complete state, THE Todo_List SHALL render the Task with a visual distinction (e.g., strikethrough text).
8. WHEN the user activates the delete control for a Task, THE Todo_List SHALL remove the Task from the list.
9. THE Todo_List SHALL persist all Tasks to Local_Storage after every add, edit, complete-toggle, or delete operation.
10. WHEN the Dashboard loads, THE Todo_List SHALL restore all Tasks previously saved in Local_Storage.

---

### Requirement 4: Quick Links Management

**User Story:** As a user, I want to save and launch shortcut buttons for my favorite websites, so that I can open them quickly without typing URLs.

#### Acceptance Criteria

1. WHEN the user provides a non-empty label and a non-empty URL and activates the save control, THE Quick_Links widget SHALL add a new Link and render it as a clickable button.
2. IF the user attempts to save a Link with an empty label or an empty URL, THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message.
3. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the Link's URL in a new browser tab.
4. WHEN the user activates the delete control for a Link, THE Quick_Links widget SHALL remove that Link from the list.
5. THE Quick_Links widget SHALL persist all Links to Local_Storage after every add or delete operation.
6. WHEN the Dashboard loads, THE Quick_Links widget SHALL restore all Links previously saved in Local_Storage.

---

### Requirement 5: Data Persistence and Storage

**User Story:** As a user, I want my tasks and quick links to survive browser refreshes and restarts, so that I do not need to re-enter data every time I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL store all Task data under a dedicated Local_Storage key.
2. THE Dashboard SHALL store all Link data under a dedicated Local_Storage key separate from the Task data key.
3. WHEN Local_Storage contains a value that cannot be parsed as valid JSON, THE Dashboard SHALL discard the corrupted value and initialize with an empty dataset.
4. THE Dashboard SHALL operate fully without a network connection, relying exclusively on Local_Storage for data.

---

### Requirement 6: Layout, Visual Design, and Browser Compatibility

**User Story:** As a user, I want a clean, readable, and visually consistent interface that works in any modern browser, so that I can use the Dashboard without friction regardless of my environment.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets (Greeting_Widget, Focus_Timer, Todo_List, Quick_Links) in a single-page layout with clear visual separation between widgets.
2. THE Dashboard SHALL apply a consistent typographic scale with a minimum body font size of 14px for readability.
3. THE Dashboard SHALL be contained in exactly one HTML file, one CSS file, and one JavaScript file.
4. THE Dashboard SHALL load and render completely within 2 seconds on a modern machine with no network activity required after initial page load.
5. THE Dashboard SHALL render without layout errors in the current stable release of Chrome, Firefox, Edge, and Safari.
6. WHEN the viewport width is 768px or wider, THE Dashboard SHALL present widgets in a multi-column grid layout.
7. WHEN the viewport width is below 768px, THE Dashboard SHALL present widgets in a single-column stacked layout.
