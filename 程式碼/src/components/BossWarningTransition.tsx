import React, { useEffect, useRef } from "react";

export interface BossWarningTransitionProps {
  active: boolean;
  onComplete: () => void;
}

const BOSS_WARNING_DURATION_MS = 2600;
const WARNING_IMAGE_URL =
  "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/5.UI/Warning.png";

const BOSS_WARNING_STYLES = `
  .boss-warning-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    overflow: hidden;
    pointer-events: all;
    background-color: #ffffff;
    background-image: url("${WARNING_IMAGE_URL}");
    background-repeat: repeat;
    background-size: cover;
    background-position: center;
    isolation: isolate;
    animation: bossWarningLifecycle 2.6s linear forwards;
  }

  .boss-warning-overlay::before {
    content: "";
    position: absolute;
    inset: -3%;
    z-index: 0;
    background-color: #ffffff;
    background-image: inherit;
    background-repeat: repeat;
    background-size: cover;
    background-position: 0% 100%;
    transform-origin: center;
    will-change: transform, background-position, opacity;
    animation: warningScroll 1.2s linear infinite;
  }


  @keyframes warningScroll {
    0% {
      background-position: 0% 100%;
      transform: scale(1);
    }
    100% {
      background-position: 100% 0%;
      transform: scale(1.05);
    }
  }


  @keyframes bossWarningLifecycle {
    0% { opacity: 0; }
    5.77% { opacity: 1; }
    88.46% { opacity: 1; }
    100% { opacity: 0; }
  }

`;

export function BossWarningTransition({
  active,
  onComplete,
}: BossWarningTransitionProps) {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => {
      onCompleteRef.current();
    }, BOSS_WARNING_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <>
      <style>{BOSS_WARNING_STYLES}</style>
      <div
        className="boss-warning-overlay"
        role="alert"
        aria-label="Boss battle warning"
      />
    </>
  );
}