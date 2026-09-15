import { useEffect, RefObject } from 'react';

export function useFocusTrap(isActive: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const modalElement = ref.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => Array.from(modalElement.querySelectorAll<HTMLElement>(focusableSelector));

    const focusables = getFocusable();
    if (focusables.length > 0) {
      // Find the first element that is not disabled
      const initialFocus = focusables.find(el => {
        if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          return !el.disabled;
        }
        return true;
      });
      if (initialFocus) {
        initialFocus.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = getFocusable().filter(el => {
        if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          return !el.disabled;
        }
        return true;
      });

      if (currentFocusables.length === 0) return;

      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, ref]);
}
