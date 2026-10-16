export type CardLayoutSlotKey = "image" | "title" | "descriptionLabel" | "descriptionContent" | "extraLabel" | "extraContent";

export interface CardLayoutRect { left: number; top: number; width: number; height: number; }
export type CardLayoutConfig = Record<CardLayoutSlotKey, CardLayoutRect>;

export const DEFAULT_CARD_LAYOUT: CardLayoutConfig = {
  image: { left: 6.6, top: 7, width: 86.8, height: 31 },
  title: { left: 9, top: 39.4, width: 66, height: 6.8 },
  descriptionLabel: { left: 11.5, top: 48, width: 38, height: 2.6 },
  descriptionContent: { left: 11.9, top: 51, width: 76, height: 9.6 },
  extraLabel: { left: 11.5, top: 63.2, width: 30, height: 2.6 },
  extraContent: { left: 11.9, top: 66.2, width: 76, height: 10.4 },
};
