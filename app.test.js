/**
 * Unit and property-based tests for Todo List Life Dashboard (app.js).
 *
 * Jest runs in a jsdom environment so `window` is available.
 * app.js is loaded via require(), which executes the IIFE and attaches
 * window.AppTestHarness with all testable namespaces.
 */

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// Load app.js so the IIFE runs and window.AppTestHarness is populated.
require('./js/app.js');

const fc = require('fast-check');

const { GreetingWidget, FocusTimer, QuickLinks, TodoList } = window.AppTestHarness;

// ─── Task 3.1 — Property 6: Task persistence is a round-trip ────────────────
// Feature: todo-list-life-dashboard, Property 6: Task persistence is a round-trip
// Validates: Requirements 3.9, 3.10, 5.1

describe('Storage — Property 6: Task persistence is a round-trip', () => {
  const { Storage, TASKS_KEY } = window.AppTestHarness;

  afterEach(() => {
    // Clean up localStorage after each run to avoid cross-test contamination
    localStorage.removeItem(TASKS_KEY);
  });

  test('Property 6: Storage.load(TASKS_KEY) deeply equals the array passed to Storage.save(TASKS_KEY, tasks)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            description: fc.string().filter((s) => s.trim() !== ''),
            completed: fc.boolean(),
          })
        ),
        (tasks) => {
          // Act: save then load
          Storage.save(TASKS_KEY, tasks);
          const loaded = Storage.load(TASKS_KEY);

          // Assert: loaded array is deeply equal to the saved array
          expect(loaded).toEqual(tasks);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 8.4 — QuickLinks.openLink calls window.open correctly ──────────────
// Validates: Requirements 4.3

describe('QuickLinks.openLink', () => {
  let originalOpen;

  beforeEach(() => {
    // Save original and replace with a Jest mock
    originalOpen = window.open;
    window.open = jest.fn();
  });

  afterEach(() => {
    // Restore original window.open after each test
    window.open = originalOpen;
  });

  test('calls window.open with (url, "_blank", "noopener,noreferrer")', () => {
    const url = 'https://example.com';

    QuickLinks.openLink(url);

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
  });

  test('passes the exact URL provided without modification', () => {
    const url = 'https://github.com/user/repo?tab=readme';

    QuickLinks.openLink(url);

    expect(window.open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
  });
});

// ─── Task 8.2 — Property 9: Adding a valid link grows the list by one ────────
// Feature: todo-list-life-dashboard, Property 9: Adding a valid link grows the list by one
// Validates: Requirements 4.1

describe('QuickLinks.addLink — Property 9', () => {
  beforeEach(() => {
    // Reset links array to a clean state before each test run
    QuickLinks.links = [];
  });

  test('Property 9: adding a valid link grows the list by exactly 1 and stores trimmed values', () => {
    fc.assert(
      fc.property(
        // Arbitrary initial links list state
        fc.array(
          fc.record({
            id: fc.string(),
            label: fc.string().filter((s) => s.trim() !== ''),
            url: fc.string().filter((s) => s.trim() !== ''),
          })
        ),
        // Valid label and url (non-empty after trim)
        fc.string().filter((s) => s.trim() !== ''),
        fc.string().filter((s) => s.trim() !== ''),
        (initialLinks, label, url) => {
          // Arrange: set the links list to the generated initial state
          QuickLinks.links = initialLinks.map((l) => Object.assign({}, l));
          const lengthBefore = QuickLinks.links.length;

          // Act
          QuickLinks.addLink(label, url);

          // Assert: list grew by exactly 1
          expect(QuickLinks.links.length).toBe(lengthBefore + 1);

          // Assert: new link has trimmed label and url
          const newLink = QuickLinks.links[QuickLinks.links.length - 1];
          expect(newLink.label).toBe(label.trim());
          expect(newLink.url).toBe(url.trim());
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 6.5 — Property 7: Completion toggle is its own inverse ─────────────
// Feature: todo-list-life-dashboard, Property 7: Completion toggle is its own inverse
// Validates: Requirements 3.6

describe('TodoList.toggleComplete — Property 7', () => {
  beforeEach(() => {
    // Reset tasks array to a clean state before each test run
    TodoList.tasks = [];
  });

  test('Property 7: toggleComplete once flips completed; twice restores original', () => {
    fc.assert(
      fc.property(
        // Arbitrary initial completed state
        fc.boolean(),
        (initialCompleted) => {
          // Arrange: create a single task with the generated completed state
          const taskId = 'test-task-id';
          TodoList.tasks = [
            { id: taskId, description: 'Test task', completed: initialCompleted },
          ];

          // Act (once): toggle
          TodoList.toggleComplete(taskId);
          const afterOneToggle = TodoList.tasks.find((t) => t.id === taskId).completed;

          // Assert: one toggle flips the value
          expect(afterOneToggle).toBe(!initialCompleted);

          // Act (twice): toggle again
          TodoList.toggleComplete(taskId);
          const afterTwoToggles = TodoList.tasks.find((t) => t.id === taskId).completed;

          // Assert: two toggles restore the original value (round-trip)
          expect(afterTwoToggles).toBe(initialCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 4.2 — Property 1: Time formatting always produces valid HH:MM ──────
// Feature: todo-list-life-dashboard, Property 1: Time formatting always produces valid HH:MM
// Validates: Requirements 1.1

describe('GreetingWidget.formatTime — Property 1', () => {
  test('Property 1: formatTime always returns a string matching HH:MM with valid hour and minute ranges', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const result = GreetingWidget.formatTime(date);

          // Assert: result matches the HH:MM pattern
          expect(result).toMatch(/^\d{2}:\d{2}$/);

          // Assert: HH is in [00–23]
          const hh = parseInt(result.split(':')[0], 10);
          expect(hh).toBeGreaterThanOrEqual(0);
          expect(hh).toBeLessThanOrEqual(23);

          // Assert: MM is in [00–59]
          const mm = parseInt(result.split(':')[1], 10);
          expect(mm).toBeGreaterThanOrEqual(0);
          expect(mm).toBeLessThanOrEqual(59);

          // Assert: values match what the date actually has
          expect(hh).toBe(date.getHours());
          expect(mm).toBe(date.getMinutes());
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 5.2 — Property 3: Timer formatting always produces valid MM:SS ─────
// Feature: todo-list-life-dashboard, Property 3: Timer formatting always produces valid MM:SS
// Validates: Requirements 2.7

describe('FocusTimer.formatTime — Property 3', () => {
  test('Property 3: formatTime always returns a valid MM:SS string and round-trips back to the input', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1500 }),
        (n) => {
          const result = FocusTimer.formatTime(n);

          // Assert: result matches the MM:SS pattern (two digits, colon, two digits)
          expect(result).toMatch(/^\d{2}:\d{2}$/);

          // Parse MM and SS back out and verify round-trip arithmetic
          const [mmStr, ssStr] = result.split(':');
          const mm = parseInt(mmStr, 10);
          const ss = parseInt(ssStr, 10);

          // Assert: SS is in [0, 59]
          expect(ss).toBeGreaterThanOrEqual(0);
          expect(ss).toBeLessThanOrEqual(59);

          // Assert: (MM * 60) + SS === n
          expect(mm * 60 + ss).toBe(n);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 4.3 — Property 2: Greeting correctly maps all hours to greeting strings ─
// Feature: todo-list-life-dashboard, Property 2: Greeting correctly maps all hours to greeting strings
// Validates: Requirements 1.3, 1.4, 1.5, 1.6

describe('GreetingWidget.getGreeting — Property 2', () => {
  test('Property 2: getGreeting returns exactly the correct greeting for every hour in [0–23]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        (hour) => {
          const result = GreetingWidget.getGreeting(hour);

          if (hour >= 5 && hour <= 11) {
            expect(result).toBe('Good Morning');
          } else if (hour >= 12 && hour <= 17) {
            expect(result).toBe('Good Afternoon');
          } else if (hour >= 18 && hour <= 21) {
            expect(result).toBe('Good Evening');
          } else {
            // hour in [22–23] or [0–4]
            expect(result).toBe('Good Night');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 6.2 — Property 4: Adding a valid task grows the list by one ────────
// Feature: todo-list-life-dashboard, Property 4: Adding a valid task grows the list by one
// Validates: Requirements 3.1

describe('TodoList.addTask — Property 4', () => {
  beforeEach(() => {
    // Reset tasks array to a clean state before each test run
    TodoList.tasks = [];
  });

  test('Property 4: adding a valid task grows the list by exactly 1, stores trimmed description, and sets completed to false', () => {
    fc.assert(
      fc.property(
        // Arbitrary initial task list state
        fc.array(
          fc.record({
            id: fc.string(),
            description: fc.string().filter((s) => s.trim() !== ''),
            completed: fc.boolean(),
          })
        ),
        // Valid description (non-empty after trim)
        fc.string().filter((s) => s.trim() !== ''),
        (initialTasks, description) => {
          // Arrange: set the tasks list to the generated initial state
          TodoList.tasks = initialTasks.map((t) => Object.assign({}, t));
          const lengthBefore = TodoList.tasks.length;

          // Act
          TodoList.addTask(description);

          // Assert: list grew by exactly 1
          expect(TodoList.tasks.length).toBe(lengthBefore + 1);

          // Assert: new task has trimmed description
          const newTask = TodoList.tasks[TodoList.tasks.length - 1];
          expect(newTask.description).toBe(description.trim());

          // Assert: new task has completed === false
          expect(newTask.completed).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 6.3 — Property 5: Task validation rejects blank descriptions for both add and edit ─
// Feature: todo-list-life-dashboard, Property 5: Task validation rejects blank descriptions for both add and edit
// Validates: Requirements 3.2, 3.5

describe('TodoList — Property 5: blank input rejection', () => {
  beforeEach(() => {
    // Reset tasks array to a clean state before each test run
    TodoList.tasks = [];
  });

  test('Property 5: addTask with blank string leaves task list unchanged', () => {
    fc.assert(
      fc.property(
        // Arbitrary initial tasks list state
        fc.array(
          fc.record({
            id: fc.string(),
            description: fc.string().filter((s) => s.trim() !== ''),
            completed: fc.boolean(),
          })
        ),
        // Blank string: zero or more whitespace characters only
        fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
        (initialTasks, blankString) => {
          // Arrange: set the tasks list to the generated initial state
          TodoList.tasks = initialTasks.map((t) => Object.assign({}, t));
          const lengthBefore = TodoList.tasks.length;
          const descriptionsBefore = TodoList.tasks.map((t) => t.description);

          // Act: attempt to add a blank task
          TodoList.addTask(blankString);

          // Assert: list length is unchanged
          expect(TodoList.tasks.length).toBe(lengthBefore);

          // Assert: existing descriptions are unchanged
          const descriptionsAfter = TodoList.tasks.map((t) => t.description);
          expect(descriptionsAfter).toEqual(descriptionsBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: editTask with blank string leaves the targeted task description unchanged', () => {
    fc.assert(
      fc.property(
        // Valid initial description for the task to be edited
        fc.string().filter((s) => s.trim() !== ''),
        // Blank string: zero or more whitespace characters only
        fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
        (originalDescription, blankString) => {
          // Arrange: create a single task with a valid description
          const taskId = 'edit-target-id';
          TodoList.tasks = [
            { id: taskId, description: originalDescription.trim(), completed: false },
          ];

          // Act: attempt to edit with a blank description
          TodoList.editTask(taskId, blankString);

          // Assert: the task's description is unchanged
          const task = TodoList.tasks.find((t) => t.id === taskId);
          expect(task).toBeDefined();
          expect(task.description).toBe(originalDescription.trim());
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 5.4 — FocusTimer state transition unit tests ───────────────────────
// Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.6

describe('FocusTimer state transitions', () => {
  beforeEach(() => {
    // Reset timer state to a clean 25:00 baseline before every test
    FocusTimer.stop();
    FocusTimer.state.remainingSeconds = 1500;
    FocusTimer.state.isRunning = false;
    FocusTimer.state.isFinished = false;
    FocusTimer.state.intervalId = null;
  });

  afterEach(() => {
    // Ensure any running interval is cleared and real timers are restored
    FocusTimer.stop();
    jest.useRealTimers();
  });

  // Requirement 2.1 — timer initialises at 25:00 (1500 seconds)
  test('initializes with remainingSeconds === 1500', () => {
    expect(FocusTimer.state.remainingSeconds).toBe(1500);
    expect(FocusTimer.state.isRunning).toBe(false);
    expect(FocusTimer.state.isFinished).toBe(false);
  });

  // Requirement 2.2 — start + advance N seconds → remainingSeconds decreases by N
  test('start + advance N seconds decreases remainingSeconds by N', () => {
    jest.useFakeTimers();

    FocusTimer.start();
    expect(FocusTimer.state.isRunning).toBe(true);

    // Advance 5 ticks (5 seconds)
    jest.advanceTimersByTime(5000);

    expect(FocusTimer.state.remainingSeconds).toBe(1500 - 5);
  });

  // Requirement 2.4 — stop pauses the countdown (value unchanged after stop + advance)
  test('stop pauses countdown — remainingSeconds unchanged after stop + advance', () => {
    jest.useFakeTimers();

    FocusTimer.start();
    jest.advanceTimersByTime(3000); // countdown 3 seconds → 1497
    const valueAtStop = FocusTimer.state.remainingSeconds;

    FocusTimer.stop();
    expect(FocusTimer.state.isRunning).toBe(false);

    // Advance time further — no ticks should fire after stop
    jest.advanceTimersByTime(10000);
    expect(FocusTimer.state.remainingSeconds).toBe(valueAtStop);
  });

  // Requirement 2.5 — reset restores 25:00 regardless of current countdown position
  test('reset restores remainingSeconds to 1500 and clears finished state', () => {
    jest.useFakeTimers();

    FocusTimer.start();
    jest.advanceTimersByTime(20000); // countdown 20 seconds
    expect(FocusTimer.state.remainingSeconds).toBe(1480);

    FocusTimer.reset();

    expect(FocusTimer.state.remainingSeconds).toBe(1500);
    expect(FocusTimer.state.isRunning).toBe(false);
    expect(FocusTimer.state.isFinished).toBe(false);
  });

  // Requirement 2.6 — timer stops and sets isFinished = true when it reaches 0:00
  test('timer sets isFinished = true and stops when countdown reaches 0', () => {
    jest.useFakeTimers();

    FocusTimer.start();

    // Advance exactly 1500 seconds to drain the timer to 0
    jest.advanceTimersByTime(1500 * 1000);

    expect(FocusTimer.state.remainingSeconds).toBe(0);
    expect(FocusTimer.state.isFinished).toBe(true);
    expect(FocusTimer.state.isRunning).toBe(false);
    expect(FocusTimer.state.intervalId).toBeNull();
  });
});

// ─── Task 3.2 — Property 8: Link persistence is a round-trip ─────────────────
// Feature: todo-list-life-dashboard, Property 8: Link persistence is a round-trip
// Validates: Requirements 4.5, 4.6, 5.2

describe('Storage — Property 8: Link persistence is a round-trip', () => {
  const { Storage, LINKS_KEY } = window.AppTestHarness;

  test('Property 8: Storage.load(LINKS_KEY) deeply equals the array passed to Storage.save(LINKS_KEY, links)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            label: fc.string().filter((s) => s.trim() !== ''),
            url: fc.string().filter((s) => s.trim() !== ''),
          })
        ),
        (links) => {
          // Act: save then load
          Storage.save(LINKS_KEY, links);
          const loaded = Storage.load(LINKS_KEY);

          // Assert: round-trip produces a deeply equal array
          expect(loaded).toEqual(links);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Task 3.3 — Property 10: Corrupt storage falls back to empty array ────────
// Feature: todo-list-life-dashboard, Property 10: Corrupt storage falls back to empty array
// Validates: Requirements 5.3

describe('Storage.load — Property 10: corrupt storage fallback', () => {
  const { Storage } = window.AppTestHarness;
  const TEST_KEY = 'property_10_test_key';

  afterEach(() => {
    // Clean up the test key from localStorage after each run
    localStorage.removeItem(TEST_KEY);
  });

  test('Property 10: Storage.load returns [] and does not throw when stored value is corrupt JSON', () => {
    fc.assert(
      fc.property(
        // Generate strings that are NOT valid JSON (JSON.parse will throw)
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false;
          } catch (e) {
            return true;
          }
        }),
        (corruptString) => {
          // Arrange: write the corrupt string directly into localStorage
          localStorage.setItem(TEST_KEY, corruptString);

          // Act + Assert: Storage.load must not throw and must return []
          let result;
          expect(() => {
            result = Storage.load(TEST_KEY);
          }).not.toThrow();

          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
