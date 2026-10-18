const ASSET_VERSION = "20260713";

export const BACKGROUND_ASSETS = {
  lab: `https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/3.%20background/LAB.jpg?v=${ASSET_VERSION}-27d6d81a`,
  // The source laboratory art is desktop-sized. Phones use this smaller WebP
  // variant so entering the lab does not decode the 1920px background.
  labMobile: `${import.meta.env.BASE_URL}assets/mobile/lab-mobile.webp`,
  tech: `https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/3.%20background/R%26D%20and%20Technical%20Department.png?v=${ASSET_VERSION}`,
  business: `https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/3.%20background/business.jpg?v=${ASSET_VERSION}-d89f0a6c`,
  purchase: `https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/3.%20background/purchase.jpg?v=${ASSET_VERSION}-b46ee0ee`,
} as const;
