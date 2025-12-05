/**
 * Shared UI utilities for the extension
 */

/**
 * Shows a status message in the specified element
 * @param statusElement - The div element to show status in
 * @param message - Message text to display
 * @param isError - Whether this is an error message (default: false)
 * @param duration - How long to show the message in ms (default: 3000)
 */
export function showStatus(
  statusElement: HTMLElement,
  message: string,
  isError = false,
  duration = 3000
): void {
  statusElement.textContent = message;
  statusElement.className = `status ${isError ? 'error' : 'success'}`;

  setTimeout(() => {
    statusElement.className = 'status hidden';
  }, duration);
}

/**
 * Safely gets an element by ID with type checking
 * @param id - Element ID
 * @param type - Optional element type for validation
 * @returns The element or null if not found
 */
export function getElement<T extends HTMLElement>(
  id: string,
  type?: new () => T
): T | null {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id "${id}" not found`);
    return null;
  }
  if (type && !(element instanceof type)) {
    console.warn(`Element "${id}" is not of expected type`);
    return null;
  }
  return element as T;
}

/**
 * Wraps an async button action with loading state management
 * @param button - The button element
 * @param action - Async action to perform
 * @param statusElement - Element to show status messages
 * @param successMessage - Message on success
 * @param errorMessage - Message on error
 */
export async function withButtonLoading(
  button: HTMLButtonElement,
  action: () => Promise<{ success: boolean; error?: string }>,
  statusElement: HTMLElement,
  successMessage: string,
  errorMessage: string
): Promise<void> {
  try {
    button.disabled = true;
    const result = await action();

    if (result.success) {
      showStatus(statusElement, successMessage);
    } else {
      showStatus(statusElement, result.error || errorMessage, true);
    }
  } catch (error) {
    console.warn('Button action failed:', error);
    showStatus(statusElement, errorMessage, true);
  } finally {
    button.disabled = false;
  }
}
