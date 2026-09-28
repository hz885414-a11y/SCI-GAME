import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_GAME_CONFIG } from "./defaults";
import { isFirebaseConfigured, loadFirebaseConfig } from "./firebase";
import { setRuntimeConfig } from "./runtimeStore";
import type { ConfigSource, GameConfig } from "./types";

const ConfigContext = createContext({ config: DEFAULT_GAME_CONFIG, source: "local-default" as ConfigSource, loading: true });

export function GameConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState(DEFAULT_GAME_CONFIG);
  const [source, setSource] = useState<ConfigSource>("local-default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRuntimeConfig(DEFAULT_GAME_CONFIG);
    if (!isFirebaseConfigured()) { setLoading(false); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    loadFirebaseConfig(controller.signal)
      .then((remote) => {
        if (!remote) return;
        const merged = { ...DEFAULT_GAME_CONFIG, ...remote, gameplay: { ...DEFAULT_GAME_CONFIG.gameplay, ...remote.gameplay } };
        setConfig(merged);
        setRuntimeConfig(merged);
        setSource("firebase");
      })
      .catch(() => { /* Exhibition-safe offline fallback. */ })
      .finally(() => { window.clearTimeout(timeout); setLoading(false); });
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, []);

  // The admin commonly runs in a second tab. Reload the Firebase document as
  // soon as that tab announces a successful save so visual tuning can be seen
  // without manually refreshing the game tab.
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const handleConfigUpdate = (event: StorageEvent) => {
      if (event.key !== "sci_game_config_updated") return;
      loadFirebaseConfig()
        .then((remote) => {
          if (!remote) return;
          const merged = { ...DEFAULT_GAME_CONFIG, ...remote, gameplay: { ...DEFAULT_GAME_CONFIG.gameplay, ...remote.gameplay } };
          setConfig(merged);
          setRuntimeConfig(merged);
          setSource("firebase");
        })
        .catch(() => { /* Keep the last valid configuration while offline. */ });
    };
    window.addEventListener("storage", handleConfigUpdate);
    return () => window.removeEventListener("storage", handleConfigUpdate);
  }, []);

  return <ConfigContext.Provider value={useMemo(() => ({ config, source, loading }), [config, source, loading])}>{children}</ConfigContext.Provider>;
}

export const useGameConfig = () => useContext(ConfigContext);
