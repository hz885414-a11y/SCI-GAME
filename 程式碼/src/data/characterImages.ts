const BASE_URL =
  "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/";

const IMAGE_VERSION = "v1";

export const characterImages = {
  claire: {
    normal: `${BASE_URL}claire.png?version=${IMAGE_VERSION}`,
    happy: `${BASE_URL}claire-HAPPY.png?version=${IMAGE_VERSION}`,
    sad: `${BASE_URL}claire-SAD.png?version=${IMAGE_VERSION}`,
    think: `${BASE_URL}claire-think.png?version=${IMAGE_VERSION}`
  },

  ethan: {
    normal: `${BASE_URL}ethan.png?version=${IMAGE_VERSION}`,
    happy: `${BASE_URL}ethan-HAPPY.png?version=${IMAGE_VERSION}`,
    sad: `${BASE_URL}ethan-SAD.png?version=${IMAGE_VERSION}`,
    think: `${BASE_URL}ethan-think.png?version=${IMAGE_VERSION}`
  },

  leo: {
    normal: `${BASE_URL}leo.png?version=${IMAGE_VERSION}`,
    happy: `${BASE_URL}leo-HAPPY.png?version=${IMAGE_VERSION}`,
    sad: `${BASE_URL}leo-SAD.png?version=${IMAGE_VERSION}`,
    think: `${BASE_URL}leo-think.png?version=${IMAGE_VERSION}`
  }
} as const;

export type CharacterName = keyof typeof characterImages;

export type CharacterMood = keyof typeof characterImages.claire;
