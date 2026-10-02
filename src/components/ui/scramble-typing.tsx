"use client";

import * as React from "react";

import { useScrambleTyping } from "@/hooks/use-scramble-typing";
import { getRandomScrambleChar } from "@/lib/scramble";
import { cn } from "@/lib/utils";

/**
 * Text effects built on a "scramble then settle" typing animation.
 *
 * Accent markup: wrap any part of a message in `<` and `>` to render it in the
 * primary color, e.g. `"Build <faster> with less"`. The angle brackets are
 * stripped from the rendered text.
 *
 * - `Stream`           — types a single (long) string, speeding up after a few seconds
 * - `DisappearReplace` — types a message, fades it out, types the next
 * - `SmoothReplace`    — scrambles in place from one message to the next
 * - `CrunchReplace`    — types a message, then crunches it away character by character
 * - `Crunch`           — an endlessly growing line of flickering glyphs (decorative)
 *
 * For no-JS fallbacks around the Replace variants, use the wrappers in
 * `scramble-wrappers.tsx`.
 */

const ACCENT_CLASS = "text-primary";
const BASE_CLASS = "text-foreground";

/** Opacity ramp for the plain "settle" trail right behind the scramble zone (oldest first). */
const NORMAL_TRAIL_CLASSES = ["opacity-80", "opacity-60"];

function parseAccentMarkup(text: string): { plainText: string; accents: boolean[] } {
  const accents: boolean[] = [];
  let plain = "";
  let accented = false;
  for (const ch of text) {
    if (ch === "<") {
      accented = true;
      continue;
    }
    if (ch === ">") {
      accented = false;
      continue;
    }
    plain += ch;
    accents.push(accented);
  }
  return { plainText: plain, accents };
}

function colorClass(accented: boolean | undefined) {
  return accented ? ACCENT_CLASS : BASE_CLASS;
}

function renderWithAccents(text: string, accents: boolean[]) {
  return text.split("").map((ch, i) => (
    <span key={i} className={colorClass(accents[i])}>
      {ch}
    </span>
  ));
}

/** Keeps a ref pointing at the latest value without writing to it during render. */
function useLatest<T>(value: T) {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function chooseNextIndex(
  current: number,
  length: number,
  historyRef: React.RefObject<number[]>,
  random?: boolean
) {
  let next = current;
  if (random) {
    if (length > historyRef.current.length) {
      do {
        next = Math.floor(Math.random() * length);
      } while (historyRef.current.includes(next));
    } else {
      next = Math.floor(Math.random() * length);
    }
  } else {
    next = (current + 1) % length;
  }
  historyRef.current.push(next);
  while (historyRef.current.length > 3) historyRef.current.shift();
  return next;
}

interface ScrambleSegmentsProps {
  stableText: string;
  normalEffect: string;
  scrambleChars: string[];
  accents: boolean[];
}

function ScrambleSegments({ stableText, normalEffect, scrambleChars, accents }: ScrambleSegmentsProps) {
  return (
    <>
      {stableText.split("").map((ch, i) => (
        <span key={`stable-${i}`} className={colorClass(accents[i])}>
          {ch}
        </span>
      ))}
      {normalEffect.split("").map((ch, index) => {
        const i = stableText.length + index;
        return (
          <span key={`normal-${index}`} className={cn(colorClass(accents[i]), NORMAL_TRAIL_CLASSES[index])}>
            {ch}
          </span>
        );
      })}
      {scrambleChars.map((ch, index) => {
        const i = stableText.length + normalEffect.length + index;
        return (
          <span key={`scramble-${index}`} className={colorClass(accents[i])}>
            {ch}
          </span>
        );
      })}
    </>
  );
}

export interface ReplaceProps {
  messages: string[];
  /**
   * When true, select the next message randomly while avoiding the last
   * three displayed messages. Defaults to sequential rotation.
   */
  random?: boolean;
  /**
   * Average time in milliseconds to wait before transitioning to the next
   * message. If omitted, each component uses its own default.
   */
  averageDelayMs?: number;
  /** Optional class names applied to the wrapper element. */
  className?: string;
}

interface TypingEffectProps {
  text: string;
  scrambleSpeed: number;
  delay: number;
  onComplete?: () => void;
  className?: string;
}

const TYPING_INTERVAL = 75; // constant typing speed, ms per character
const FINISH_DELAY = 1000; // hold after fully typed, before fading out
const FADE_DURATION = 1500; // fade-out duration in ms

/** Types `text` at a constant pace, holds, fades out, then calls `onComplete`. */
function TypingEffect({ text, scrambleSpeed, delay, onComplete, className }: TypingEffectProps) {
  const { plainText, accents } = React.useMemo(() => parseAccentMarkup(text), [text]);

  const [finished, setFinished] = React.useState(false);
  const [fadeOut, setFadeOut] = React.useState(false);
  const onCompleteRef = useLatest(onComplete);
  const finishTimersRef = React.useRef<number[]>([]);

  // Runs once the hook has fully drained its scramble window: hold, fade out, then notify.
  const handleDrained = React.useCallback(() => {
    setFinished(true);
    finishTimersRef.current.push(
      window.setTimeout(() => {
        setFadeOut(true);
        finishTimersRef.current.push(window.setTimeout(() => onCompleteRef.current?.(), FADE_DURATION));
      }, FINISH_DELAY)
    );
  }, [onCompleteRef]);

  React.useEffect(() => {
    const timers = finishTimersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const { setTypedCount, stableText, normalEffect, scrambleChars } = useScrambleTyping({
    text: plainText,
    scrambleSpeed,
    delay,
    onComplete: handleDrained,
  });

  // Constant-pace typing after the initial delay.
  React.useEffect(() => {
    let currentIndex = 0;
    let intervalId: number | undefined;

    const startTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        currentIndex++;
        setTypedCount(currentIndex);
        if (currentIndex >= plainText.length) window.clearInterval(intervalId);
      }, TYPING_INTERVAL);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(intervalId);
    };
  }, [plainText, delay, setTypedCount]);

  if (finished) {
    return (
      <span
        className={cn(
          "inline-block text-left transition-opacity ease-out",
          fadeOut && "opacity-0",
          className
        )}
        style={{ transitionDuration: `${FADE_DURATION}ms` }}
      >
        {renderWithAccents(plainText, accents)}
      </span>
    );
  }

  return (
    <span className={cn("inline-block text-left", className)}>
      <ScrambleSegments
        stableText={stableText}
        normalEffect={normalEffect}
        scrambleChars={scrambleChars}
        accents={accents}
      />
    </span>
  );
}

export function DisappearReplace({ messages, random = false, averageDelayMs = 500, className }: ReplaceProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const historyRef = React.useRef<number[]>([0]);
  const timerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleComplete = React.useCallback(() => {
    timerRef.current = window.setTimeout(() => {
      setCurrentIndex((prev) => chooseNextIndex(prev, messages.length, historyRef, random));
    }, averageDelayMs);
  }, [messages.length, random, averageDelayMs]);

  return (
    <span className={cn("inline-block", className)}>
      <TypingEffect
        key={currentIndex}
        text={messages[currentIndex]}
        scrambleSpeed={147}
        delay={0}
        onComplete={handleComplete}
        className="inline"
      />
    </span>
  );
}

const SMOOTH_SCRAMBLE_MS = 50;
const SMOOTH_OUT_DURATION = 800;

export function SmoothReplace({ messages, random = false, averageDelayMs = 4000, className }: ReplaceProps) {
  const parsed = React.useMemo(() => messages.map((m) => parseAccentMarkup(m)), [messages]);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const historyRef = React.useRef<number[]>([0]);

  const [scrambling, setScrambling] = React.useState(false);
  const [scrambledText, setScrambledText] = React.useState(parsed[0]?.plainText ?? "");
  const [currentAccents, setCurrentAccents] = React.useState<boolean[]>(parsed[0]?.accents ?? []);

  // Latest props/derived values, read from timer callbacks.
  const latest = useLatest({ parsed, random, averageDelayMs, count: messages.length });

  React.useEffect(() => {
    const intervals = new Set<number>();
    const timeouts = new Set<number>();

    const every = (fn: () => void, ms: number) => {
      const id = window.setInterval(fn, ms);
      intervals.add(id);
      return id;
    };
    const after = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timeouts.add(id);
      return id;
    };
    const stop = (id: number) => {
      window.clearInterval(id);
      intervals.delete(id);
    };

    const transition = (fromIdx: number, toIdx: number, onDone: () => void) => {
      const from = latest.current.parsed[fromIdx];
      const to = latest.current.parsed[toIdx];

      let chars = from.plainText.split("").map(() => getRandomScrambleChar());
      setScrambledText(chars.join(""));
      setCurrentAccents(from.accents);

      const delta = to.plainText.length - chars.length;
      const steps = Math.abs(delta);

      // Phase 1: scramble the outgoing message in place.
      const outId = every(() => {
        chars = chars.map(() => getRandomScrambleChar());
        setScrambledText(chars.join(""));
      }, SMOOTH_SCRAMBLE_MS);

      after(() => {
        stop(outId);

        // Phase 3: reveal the incoming message left to right.
        const startReveal = () => {
          let revealIndex = 0;
          setCurrentAccents(to.accents);
          const inId = every(() => {
            chars = chars.map((_, i) => (i <= revealIndex ? to.plainText[i] : getRandomScrambleChar()));
            setScrambledText(chars.join(""));
            if (++revealIndex >= to.plainText.length) {
              stop(inId);
              onDone();
            }
          }, SMOOTH_SCRAMBLE_MS);
        };

        // Phase 2: grow/shrink to the incoming message's length.
        if (steps > 0) {
          let count = 0;
          const lenId = every(() => {
            if (delta > 0) chars.push(getRandomScrambleChar());
            else chars.pop();
            setScrambledText(chars.join(""));
            if (++count >= steps) {
              stop(lenId);
              startReveal();
            }
          }, SMOOTH_SCRAMBLE_MS);
        } else {
          startReveal();
        }
      }, SMOOTH_OUT_DURATION);
    };

    const startScramble = (fromIdx: number) => {
      const { count, random: isRandom } = latest.current;
      if (count < 2) return;
      setScrambling(true);
      const nextIdx = chooseNextIndex(fromIdx, count, historyRef, isRandom);

      transition(fromIdx, nextIdx, () => {
        const { parsed: p, averageDelayMs: avg } = latest.current;
        setScrambling(false);
        setCurrentIndex(nextIdx);
        setScrambledText(p[nextIdx].plainText);
        setCurrentAccents(p[nextIdx].accents);

        if (avg > 0) {
          // Hold before the next scramble (±20%).
          after(() => startScramble(nextIdx), avg * (0.8 + Math.random() * 0.4));
        }
      });
    };

    after(() => startScramble(0), latest.current.averageDelayMs * 1.75);

    return () => {
      intervals.forEach((id) => window.clearInterval(id));
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [latest]);

  const current = parsed[currentIndex];

  return (
    <span className={cn("inline-block leading-none", className)}>
      {scrambling
        ? renderWithAccents(scrambledText, currentAccents)
        : current && renderWithAccents(current.plainText, current.accents)}
    </span>
  );
}

export function CrunchReplace({ messages, random = false, averageDelayMs = 0, className }: ReplaceProps) {
  const parsed = React.useMemo(() => messages.map((m) => parseAccentMarkup(m)), [messages]);

  const [index, setIndex] = React.useState(0);
  const historyRef = React.useRef<number[]>([0]);

  // "typing" renders TypingEffect; "crunch" runs the scramble-out animation.
  const [mode, setMode] = React.useState<"typing" | "crunch">("typing");
  const [scrambleText, setScrambleText] = React.useState(parsed[0]?.plainText ?? "");
  const [scrambleAccents, setScrambleAccents] = React.useState(parsed[0]?.accents ?? []);

  const holdTimerRef = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(holdTimerRef.current), []);

  const handleTypingComplete = React.useCallback(() => {
    const hold = averageDelayMs === 0 ? 0 : averageDelayMs * (0.8 + Math.random() * 0.4);
    holdTimerRef.current = window.setTimeout(() => setMode("crunch"), hold);
  }, [averageDelayMs]);

  const latest = useLatest({ parsed, random, count: messages.length });

  React.useEffect(() => {
    if (mode !== "crunch") return;
    const { parsed: p } = latest.current;
    const { plainText, accents } = p[index];
    const chars = plainText.split("");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the accent mask for the current message before the timers below start
    setScrambleAccents(accents);

    const timers: number[] = [];

    // For each character: scramble it, then blank it.
    chars.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          chars[i] = getRandomScrambleChar();
          setScrambleText(chars.join(""));
        }, i * 50)
      );
      timers.push(
        window.setTimeout(() => {
          chars[i] = "";
          setScrambleText(chars.join(""));
        }, i * 50 + 200)
      );
    });

    // Once everything is blank, move to the next message and type it.
    timers.push(
      window.setTimeout(() => {
        const { count, random: isRandom, parsed: latestParsed } = latest.current;
        const next = chooseNextIndex(index, count, historyRef, isRandom);
        setIndex(next);
        setScrambleText(latestParsed[next].plainText);
        setScrambleAccents(latestParsed[next].accents);
        setMode("typing");
      }, chars.length * 50 + 250)
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [mode, index, latest]);

  if (mode === "crunch") {
    return (
      <span className={cn("inline-block leading-none", className)}>
        {renderWithAccents(scrambleText, scrambleAccents)}
      </span>
    );
  }

  return (
    <span className={cn("inline-block", className)}>
      <TypingEffect
        key={index}
        text={messages[index]}
        scrambleSpeed={147}
        delay={0}
        onComplete={handleTypingComplete}
        className="inline"
      />
    </span>
  );
}

export interface StreamProps {
  text: string;
  scrambleSpeed: number;
  delay: number;
  onComplete?: () => void;
  className?: string;
  /** Milliseconds per character during the initial constant-speed phase (first 4s). */
  charIntervalMs?: number;
}

/**
 * Types a (typically long) string: constant pace for the first 4 seconds,
 * then in random-sized bursts so long text doesn't take forever.
 */
export function Stream({ text, scrambleSpeed, delay, onComplete, className, charIntervalMs = 37 }: StreamProps) {
  const { plainText, accents } = React.useMemo(() => parseAccentMarkup(text), [text]);
  const { setTypedCount, stableText, normalEffect, scrambleChars } = useScrambleTyping({
    text: plainText,
    scrambleSpeed,
    delay,
    onComplete,
  });

  React.useEffect(() => {
    let cancelled = false;
    let currentIndex = 0;
    let startTime = 0;
    const timers = new Set<number>();
    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    function typeBatch() {
      if (cancelled || currentIndex >= plainText.length) return;

      if (Date.now() - startTime < 4000) {
        currentIndex++;
        setTypedCount(currentIndex);
        schedule(typeBatch, charIntervalMs);
        return;
      }

      // After the constant-speed phase: random burst size and per-character delay.
      const batchSize = Math.min(Math.floor(Math.random() * 21), plainText.length - currentIndex);
      const perCharDelay = Math.floor(Math.random() * 20);
      let i = 0;
      const typeNextChar = () => {
        if (cancelled) return;
        currentIndex++;
        setTypedCount(currentIndex);
        i++;
        if (i < batchSize && currentIndex < plainText.length) {
          schedule(typeNextChar, perCharDelay);
        } else {
          schedule(typeBatch, 0);
        }
      };
      typeNextChar();
    }

    schedule(() => {
      startTime = Date.now();
      typeBatch();
    }, delay);

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [plainText, delay, charIntervalMs, setTypedCount]);

  return (
    <div className={cn("text-left", className)}>
      <ScrambleSegments
        stableText={stableText}
        normalEffect={normalEffect}
        scrambleChars={scrambleChars}
        accents={accents}
      />
    </div>
  );
}

interface CrunchChar {
  id: string;
  birth: number;
  char: string;
  lastUpdate: number;
  flicker?: boolean;
}

/** Reroll intervals (ms) for the six scrambling characters at the newest end, oldest first. */
const CRUNCH_SCRAMBLE_SPEEDS = [250, 200, 160, 130, 100, 90];
/** Opacity ramp for the six "just settled" characters before the scramble zone, oldest first. */
const CRUNCH_FIXED_CLASSES = ["opacity-40", "opacity-50", "opacity-60", "opacity-70", "opacity-80", "opacity-90"];

let crunchIdCounter = 0;

/**
 * Decorative: an endlessly growing line of glyphs. The newest six scramble at
 * increasing speeds, the six before them fade in as they settle, and older
 * characters occasionally flicker.
 */
export function Crunch({ className }: { className?: string }) {
  const [chars, setChars] = React.useState<CrunchChar[]>([]);
  const lastFlickeredRef = React.useRef<number | null>(null);

  // High-frequency scramble/flicker updates.
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setChars((prev) => {
        const now = Date.now();
        const total = prev.length;
        return prev.map((ch, index) => {
          if (ch.flicker) {
            return now - ch.lastUpdate >= 30 ? { ...ch, char: getRandomScrambleChar(), lastUpdate: now } : ch;
          }
          // Of the newest 12, indices [6..11] scramble.
          const groupIndex = index - (total - 12);
          if (groupIndex >= 6 && groupIndex < 12) {
            const lastUpdate = ch.lastUpdate || ch.birth;
            if (now - lastUpdate >= CRUNCH_SCRAMBLE_SPEEDS[groupIndex - 6]) {
              return { ...ch, char: getRandomScrambleChar(), lastUpdate: now };
            }
          }
          return ch;
        });
      });
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  // Growth: add one character every ~2.5s.
  React.useEffect(() => {
    let timer: number | undefined;
    const addChar = () => {
      const now = Date.now();
      setChars((prev) => [
        ...prev,
        { id: `c${crunchIdCounter++}`, birth: now, char: getRandomScrambleChar(), lastUpdate: now },
      ]);
      timer = window.setTimeout(addChar, 2500 + Math.random() * 100);
    };
    addChar();
    return () => window.clearTimeout(timer);
  }, []);

  // Random flicker: pick a character (excluding the newest 6) and flicker it for ~500ms.
  React.useEffect(() => {
    let nextTimer: number | undefined;
    const stopTimers = new Set<number>();

    const flicker = () => {
      setChars((prev) => {
        const eligible = prev.length - 6;
        if (eligible <= 0) return prev;

        let randIndex = 0;
        if (eligible > 1) {
          do {
            randIndex = Math.floor(Math.random() * eligible);
          } while (randIndex === lastFlickeredRef.current);
        }
        lastFlickeredRef.current = randIndex;

        const targetId = prev[randIndex].id;
        const stopId = window.setTimeout(() => {
          stopTimers.delete(stopId);
          setChars((current) => current.map((ch) => (ch.id === targetId ? { ...ch, flicker: false } : ch)));
        }, 500);
        stopTimers.add(stopId);

        const next = [...prev];
        next[randIndex] = { ...next[randIndex], flicker: true, lastUpdate: Date.now() };
        return next;
      });
      nextTimer = window.setTimeout(flicker, 1000 + Math.random() * 4000);
    };

    flicker();
    return () => {
      window.clearTimeout(nextTimer);
      stopTimers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div className={cn("whitespace-pre-wrap font-sans text-foreground", className)} aria-hidden="true">
      {chars.map((ch, index) => {
        const groupIndex = index - (chars.length - 12);
        const charClass =
          groupIndex < 0 ? "text-muted-foreground" : groupIndex < 6 ? CRUNCH_FIXED_CLASSES[groupIndex] : undefined;
        return (
          <span key={ch.id} className={charClass}>
            {ch.char}
          </span>
        );
      })}
    </div>
  );
}
