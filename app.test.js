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

const { QuickLinks, TodoList } = window.AppTestHarness;

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
