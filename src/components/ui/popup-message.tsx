"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type PopupPosition =
  | "top-center"
  | "top-left"
  | "top-right"
  | "bottom-center"
  | "bottom-left"
  | "bottom-right";

export type PopupMessageOptions = {
  title?: string;
  /** Rich content; overrides the message body. */
  content?: ReactNode;
  durationMs?: number;
  position?: PopupPosition;
  className?: string;
};

type PopupMessageItem = {
  id: number;
  title?: string;
  message?: string;
  content?: ReactNode;
  isVisible: boolean;
  position: PopupPosition;
  className?: string;
};

type PopupMessageContextValue = {
  /** Shows a transient message and returns its id. A string renders as body text; any other node renders as-is. */
  showPopup: (messageOrContent: ReactNode, options?: PopupMessageOptions) => number;
};

const DEFAULT_DURATION_MS = 3200;
const FADE_DURATION_MS = 280;
const DEFAULT_POSITION: PopupPosition = "top-center";

const PopupMessageContext = createContext<PopupMessageContextValue | null>(null);

const VIEWPORT_POSITION_CLASSES: Record<PopupPosition, string> = {
  "top-center": "inset-x-0 top-4 items-center",
  "top-left": "left-4 top-4 items-start",
  "top-right": "right-4 top-4 items-end",
  "bottom-center": "inset-x-0 bottom-4 items-center",
  "bottom-left": "left-4 bottom-4 items-start",
  "bottom-right": "right-4 bottom-4 items-end",
};

const POSITIONS = Object.keys(VIEWPORT_POSITION_CLASSES) as PopupPosition[];

function PopupStack({ items, position }: { items: PopupMessageItem[]; position: PopupPosition }) {
  const isBottom = position.startsWith("bottom");

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed z-50 flex max-w-full flex-col gap-2 px-4",
        VIEWPORT_POSITION_CLASSES[position]
      )}
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "pointer-events-auto w-full max-w-sm transform-gpu rounded-md border border-primary/35 bg-card/95 px-4 py-3 text-card-foreground shadow-xl backdrop-blur-sm transition-all duration-300 ease-out",
            item.isVisible ? "translate-y-0 opacity-100" : isBottom ? "translate-y-2 opacity-0" : "-translate-y-2 opacity-0",
            item.className
          )}
        >
          {item.title ? <p className="mb-1 text-sm font-semibold tracking-wide">{item.title}</p> : null}
          {item.content ?? <p className="text-sm leading-snug">{item.message}</p>}
        </div>
      ))}
    </div>
  );
}

/**
 * Lightweight toast system. Mount the provider once near the root, then call
 * `usePopupMessage().showPopup("Saved")` from any client component. Each
 * popup fades out after `durationMs`; popups stack per screen position.
 */
export function PopupMessageProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<PopupMessageItem[]>([]);
  const timeoutsRef = useRef<Map<number, number[]>>(new Map());
  const idRef = useRef(0);

  const showPopup = useCallback((messageOrContent: ReactNode, options?: PopupMessageOptions) => {
    const id = ++idRef.current;
    const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
    const message = typeof messageOrContent === "string" ? messageOrContent : undefined;
    const content = options?.content ?? (message ? undefined : messageOrContent);

    setItems((current) => [
      ...current,
      {
        id,
        message,
        content,
        title: options?.title,
        isVisible: true,
        position: options?.position ?? DEFAULT_POSITION,
        className: options?.className,
      },
    ]);

    const hideDelay = Math.max(durationMs - FADE_DURATION_MS, 0);
    const hideTimeout = window.setTimeout(() => {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, isVisible: false } : item)));
    }, hideDelay);
    const removeTimeout = window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
      timeoutsRef.current.delete(id);
    }, hideDelay + FADE_DURATION_MS);

    timeoutsRef.current.set(id, [hideTimeout, removeTimeout]);
    return id;
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((ids) => ids.forEach((t) => window.clearTimeout(t)));
      timeouts.clear();
    };
  }, []);

  const value = useMemo(() => ({ showPopup }), [showPopup]);

  return (
    <PopupMessageContext.Provider value={value}>
      {children}
      {POSITIONS.map((position) => {
        const positionItems = items.filter((item) => item.position === position);
        return positionItems.length ? <PopupStack key={position} items={positionItems} position={position} /> : null;
      })}
    </PopupMessageContext.Provider>
  );
}

export function usePopupMessage() {
  const context = useContext(PopupMessageContext);
  if (!context) {
    throw new Error("usePopupMessage must be used within PopupMessageProvider");
  }
  return context;
}
