/**
 * Centralized Keyboard Shortcut Registry & Manager
 * "ONE SHORTCUT = ONE ACTION" across Hospital ERP
 */

export type ShortcutHandler = (e: KeyboardEvent) => void | boolean;

export interface RegisteredShortcut {
  id: string;
  keys: string[]; // e.g. ["Alt+g", "Alt+Shift+s", "Ctrl+<"]
  description?: string;
  allowInInput?: boolean;
  priority?: number; // Higher runs first
  handler: ShortcutHandler;
}

// Check if an event target is an interactive editable field
export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const tagName = target.tagName.toUpperCase();
  if (tagName === "TEXTAREA" || tagName === "SELECT") return true;

  if (tagName === "INPUT") {
    const inputType = (target as HTMLInputElement).type?.toLowerCase();
    const nonTextTypes = ["checkbox", "radio", "submit", "button", "reset", "image", "file"];
    return !nonTextTypes.includes(inputType);
  }

  return false;
}

// Normalize a keyboard event into a standardized signature string
export function getEventShortcutSignature(e: KeyboardEvent): string {
  const parts: string[] = [];

  // Modifiers
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  // Key normalization
  const key = e.key;

  // Handle Ctrl + < (Shift + Comma on QWERTY or raw '<')
  if (key === "<" || (e.shiftKey && (key === "," || e.code === "Comma"))) {
    // If we already added Shift because e.shiftKey is true, we replace Shift+, with <
    const shiftIdx = parts.indexOf("Shift");
    if (shiftIdx !== -1) {
      parts.splice(shiftIdx, 1);
    }
    parts.push("<");
    return parts.join("+");
  }

  // Handle special and function keys
  if (key === "Escape" || key === "Esc") {
    parts.push("Escape");
  } else if (key === "Enter") {
    parts.push("Enter");
  } else if (key === "Delete" || key === "Del") {
    parts.push("Delete");
  } else if (key === "Backspace") {
    parts.push("Backspace");
  } else if (key === "ArrowLeft") {
    parts.push("ArrowLeft");
  } else if (key === "ArrowRight") {
    parts.push("ArrowRight");
  } else if (key === "ArrowUp") {
    parts.push("ArrowUp");
  } else if (key === "ArrowDown") {
    parts.push("ArrowDown");
  } else if (key === "F1") {
    parts.push("F1");
  } else if (key === "?") {
    parts.push("?");
  } else if (key === "/") {
    parts.push("/");
  } else if (/^[0-9]$/.test(key)) {
    parts.push(key);
  } else if (/^[a-zA-Z]$/.test(key)) {
    // Keep single letter uppercase in signature representation (e.g. Alt+G)
    parts.push(key.toUpperCase());
  } else {
    parts.push(key);
  }

  return parts.join("+");
}

class ShortcutManager {
  private registry: Map<string, RegisteredShortcut> = new Map();
  private isListening = false;

  private handleKeyDown = (e: KeyboardEvent) => {
    // Never interfere with standard clipboard and OS text editing hotkeys
    if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "z", "a"].includes(e.key.toLowerCase())) {
      return;
    }

    const isTyping = isEditableElement(e.target);
    const signature = getEventShortcutSignature(e);

    // Sort registered shortcuts by priority descending
    const sortedShortcuts = Array.from(this.registry.values()).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );

    for (const shortcut of sortedShortcuts) {
      const matches = shortcut.keys.some((k) => {
        // Compare signatures case-insensitively
        return k.toLowerCase() === signature.toLowerCase();
      });

      if (matches) {
        // If user is typing in an input, only execute if explicitly allowed
        if (isTyping && !shortcut.allowInInput) {
          continue;
        }

        // Prevent browser default and stop other listeners
        e.preventDefault();
        e.stopPropagation();

        const result = shortcut.handler(e);
        // If handler explicitly returns false, continue to next shortcut, otherwise stop
        if (result !== false) {
          return;
        }
      }
    }
  };

  public register(shortcut: RegisteredShortcut): () => void {
    this.registry.set(shortcut.id, shortcut);
    this.ensureListener();

    return () => {
      this.unregister(shortcut.id);
    };
  }

  public registerMany(shortcuts: RegisteredShortcut[]): () => void {
    shortcuts.forEach((s) => this.registry.set(s.id, s));
    this.ensureListener();

    return () => {
      shortcuts.forEach((s) => this.registry.delete(s.id));
      if (this.registry.size === 0) {
        this.cleanupListener();
      }
    };
  }

  public unregister(id: string) {
    this.registry.delete(id);
    if (this.registry.size === 0) {
      this.cleanupListener();
    }
  }

  private ensureListener() {
    if (!this.isListening && typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown, { capture: true });
      this.isListening = true;
    }
  }

  private cleanupListener() {
    if (this.isListening && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown, { capture: true });
      this.isListening = false;
    }
  }
}

// Global Singleton Shortcut Manager
export const shortcutManager = new ShortcutManager();
