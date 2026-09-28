const BASE_URL =
  "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/";

const IMAGE_VERSION = "expression-v2";

const expression = (fileName: string) =>
  `${BASE_URL}10.expression/${encodeURIComponent(fileName)}?version=${IMAGE_VERSION}`;

export const characterImages = {
  claire: {
    normal: expression("EXP-_C-COMMON01.png"),
    happy: expression("EXP-_C-happy01.png"),
    sad: expression("EXP-_C-COMMON01.png"),
    think: expression("EXP-_C-Suspect01.png"),
    dialog: expression("EXP-_C-dialog01.png"),
    surprise: expression("EXP-_C-surprise01.png"),
  },

  ethan: {
    normal: expression("EXP-_E-COMMON01.png"),
    happy: expression("EXP-_E- happy01.png"),
    sad: expression("EXP-_E-COMMON01.png"),
    think: expression("EXP-_E-Suspect01.png"),
    dialog: expression("EXP-_E-dialog01.png"),
    surprise: expression("EXP-_E-surprise01.png"),
  },

  leo: {
    normal: expression("EXP-_L -COMMON01.png"),
    happy: expression("EXP-_L-happy01.png"),
    sad: expression("EXP-_L -COMMON01.png"),
    think: expression("EXP-_L-Suspect01.png"),
    dialog: expression("EXP-_L -dialog01.png"),
    surprise: expression("EXP-_L-surprise01.png"),
  }
} as const;

export type CharacterName = keyof typeof characterImages;

export type CharacterMood = keyof typeof characterImages.claire;
