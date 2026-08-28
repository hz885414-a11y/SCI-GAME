import React, { useEffect, useRef, useState } from "react";

interface ClickImpact {
  id: number;
  x: number;
  y: number;
  interactive: boolean;
}

interface PixelCursorProps {
  rootId?: string;
}

const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])';

export function PixelCursor({ rootId = "game-container" }: PixelCursorProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const impactIdRef = useRef(0);
  const [impacts, setImpacts] = useState<ClickImpact[]>([]);

  useEffect(() => {
    const root = document.getElementById(rootId);
    const cursor = cursorRef.current;
    if (!root || !cursor || window.matchMedia("(pointer: coarse)").matches) return;

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

    const moveCursor = (event: PointerEvent) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.style.opacity = "1";
      cursor.classList.toggle("is-interactive", isInteractiveTarget(event.target));
    };
    const hideCursor = () => { cursor.style.opacity = "0"; };
    const pressCursor = (event: PointerEvent) => {
      const interactive = isInteractiveTarget(event.target);
      cursor.classList.add("is-pressed");
      const id = ++impactIdRef.current;
      setImpacts((current) => [...current.slice(-4), { id, x: event.clientX, y: event.clientY, interactive }]);
      window.setTimeout(() => {
        setImpacts((current) => current.filter((impact) => impact.id !== id));
      }, 460);
    };
    const releaseCursor = () => cursor.classList.remove("is-pressed");

    root.addEventListener("pointermove", moveCursor);
    root.addEventListener("pointerleave", hideCursor);
    root.addEventListener("pointerdown", pressCursor);
    root.addEventListener("pointerup", releaseCursor);
    root.addEventListener("pointercancel", releaseCursor);
    return () => {
      root.removeEventListener("pointermove", moveCursor);
      root.removeEventListener("pointerleave", hideCursor);
      root.removeEventListener("pointerdown", pressCursor);
      root.removeEventListener("pointerup", releaseCursor);
      root.removeEventListener("pointercancel", releaseCursor);
    };
  }, [rootId]);

  return (
    <>
      <div ref={cursorRef} className="app-pixel-cursor" aria-hidden="true">
        <span />
      </div>
      {impacts.map((impact) => (
        <span
          key={impact.id}
          className={`app-pixel-click ${impact.interactive ? "is-interactive" : ""}`}
          style={{ left: impact.x, top: impact.y }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
