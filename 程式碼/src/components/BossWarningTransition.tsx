import React, { useCallback, useEffect, useRef } from "react";

export interface BossWarningTransitionProps {
  active: boolean;
  onComplete: () => void;
}

const ROBOT_STARTUP_VIDEO_URL =
  "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/6.Cutscene/Short-DDrobot01.mp4";
const VIDEO_WATCHDOG_MS = 30_000;

export function BossWarningTransition({
  active,
  onComplete,
}: BossWarningTransitionProps) {
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;
    completedRef.current = false;

    // Avoid trapping the player if the remote video stalls unexpectedly.
    const watchdog = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    }, VIDEO_WATCHDOG_MS);

    return () => window.clearTimeout(watchdog);
  }, [active]);

  const finishTransition = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black"
      role="alert"
      aria-label="機器人啟動過場"
    >
      <video
        className="h-full w-full bg-black object-contain"
        src={ROBOT_STARTUP_VIDEO_URL}
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        onEnded={finishTransition}
        onError={finishTransition}
      />
    </div>
  );
}
