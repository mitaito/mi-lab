"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { HERO_SWITCH_CHIP, SwitchTrack } from "./switch-chip";

/** Closest the tooltip may come to the window's edges, in px. */
const EDGE = 16;

/**
 * The 3D MODE switch below the desktop breakpoint, where the 3D view does not
 * run. It is a button, not a link, so it goes nowhere: hovering it (on devices
 * that hover), focusing it from the keyboard, or clicking or tapping it shows
 * a tooltip saying 3D mode is desktop only. A second tap, a tap elsewhere, Esc
 * or moving focus away closes it. It loads no 3D code. The caller sets its display class, as with <ConstellationSwitch>.
 */
export function ConstellationSwitchUnavailable({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // The tooltip hangs under the chip, right-aligned so it grows into the row;
  // when the chip wraps to the start of a narrow row that would push it off
  // the window, so it flips to left-aligned.
  const [alignLeft, setAlignLeft] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function place() {
    const root = rootRef.current;
    const tip = tipRef.current;
    if (!root || !tip) return;
    setAlignLeft(root.getBoundingClientRect().right - tip.offsetWidth < EDGE);
  }

  return (
    <span
      ref={rootRef}
      onPointerEnter={place}
      className={`relative z-20 ${className}`}
    >
      <button
        type="button"
        aria-describedby={tipId}
        onFocus={(event) => {
          place();
          // Keyboard focus opens it; a click's focus leaves that to onClick.
          if (event.currentTarget.matches(":focus-visible")) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onClick={() => {
          place();
          setOpen((wasOpen) => !wasOpen);
        }}
        className={`${HERO_SWITCH_CHIP} peer inline-flex cursor-help`}
      >
        <Icon name="view_in_ar" className="text-xs" />
        3D MODE
        <SwitchTrack on={false} />
      </button>
      <span
        ref={tipRef}
        id={tipId}
        role="tooltip"
        className={`pointer-events-none absolute top-full mt-1.5 w-max rounded-xs border border-surface-container-highest/60 bg-surface-container-high px-2.5 py-1.5 font-mono text-label-sm text-on-surface-variant shadow-panel transition-opacity duration-150 ${
          alignLeft ? "left-0" : "right-0"
        } ${
          open
            ? "visible opacity-100"
            : "invisible opacity-0 peer-hover:visible peer-hover:opacity-100"
        }`}
      >
        Only available on desktop
      </span>
    </span>
  );
}
