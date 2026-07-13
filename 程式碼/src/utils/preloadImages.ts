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
