/**
 * 🖼️ Image preloader utility to fetch character sprites efficiently
 * in the background for active and subsequent scenes.
 */
export function preloadImages(urls: string[]) {
  if (typeof window === "undefined") return;
  urls.forEach((url) => {
    if (!url) return;
    const image = new Image();
    image.src = url;
  });
}

export interface PreloadAsset {
  label: string;
  url: string;
}

export interface AssetPreloadProgress {
  completed: number;
  total: number;
  percent: number;
  currentLabel: string;
  failed: number;
}

export interface AssetPreloadResult {
  loaded: number;
  failed: number;
  failedAssets: PreloadAsset[];
}

const loadedAssetUrls = new Set<string>();
const loadingAssetPromises = new Map<string, Promise<boolean>>();

function loadImageAsset(asset: PreloadAsset, timeoutMs: number): Promise<boolean> {
  if (loadedAssetUrls.has(asset.url)) return Promise.resolve(true);
  const existingLoad = loadingAssetPromises.get(asset.url);
  if (existingLoad) return existingLoad;

  const loadingPromise = new Promise<boolean>((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
      if (loaded) loadedAssetUrls.add(asset.url);
      resolve(loaded);
    };

    const timeoutId = window.setTimeout(() => finish(false), timeoutMs);
    image.decoding = "async";
    image.onload = () => {
      if (typeof image.decode === "function") {
        image.decode().then(() => finish(true)).catch(() => finish(true));
      } else {
        finish(true);
      }
    };
    image.onerror = () => finish(false);
    image.src = asset.url;

    if (image.complete && image.naturalWidth > 0) finish(true);
  });

  loadingAssetPromises.set(asset.url, loadingPromise);
  void loadingPromise.then(() => loadingAssetPromises.delete(asset.url));
  return loadingPromise;
}

/**
 * Preloads the boot manifest with real completion progress. A failed/slow remote
 * asset is reported but never traps the player on the boot screen forever.
 */
export async function preloadAssetManifest(
  assets: PreloadAsset[],
  onProgress?: (progress: AssetPreloadProgress) => void,
  timeoutMs = 10000,
): Promise<AssetPreloadResult> {
  const uniqueAssets = assets.filter(
    (asset, index) => asset.url && assets.findIndex((candidate) => candidate.url === asset.url) === index,
  );
  const total = uniqueAssets.length;
  let completed = 0;
  let failed = 0;
  const failedAssets: PreloadAsset[] = [];

  onProgress?.({ completed, total, percent: total ? 0 : 100, currentLabel: "建立素材清單", failed });

  await Promise.all(
    uniqueAssets.map(async (asset) => {
      const loaded = await loadImageAsset(asset, timeoutMs);
      completed += 1;
      if (!loaded) {
        failed += 1;
        failedAssets.push(asset);
      }
      onProgress?.({
        completed,
        total,
        percent: total ? Math.round((completed / total) * 100) : 100,
        currentLabel: asset.label,
        failed,
      });
    }),
  );

  return { loaded: total - failed, failed, failedAssets };
}
