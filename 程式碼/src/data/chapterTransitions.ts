export type TransitionSpeaker = "narrator" | "researcher" | "claire" | "ethan" | "leo";

export interface ChapterTransitionBeat {
  speaker: TransitionSpeaker;
  text: string;
  clue?: { label: string; title: string; detail: string; image?: string };
  choice?: { id: string; label: string }[];
}

// Played after the first shelter evacuation, before returning to the base.
// Keeping the beats as data makes later chapter handoffs use the same UI.
export const CHAPTER_ONE_TO_TWO: ChapterTransitionBeat[] = [
  {
    speaker: "narrator",
    text: "避難所的燈終於穩定亮起。撤離訊號接通前，剛才那位研究員將一份停電前的維修紀錄傳給小隊。",
  },
  {
    speaker: "researcher",
    text: "這不是避難所的故障紀錄。停電前幾分鐘，同樣的異常脈衝沿著運輸線傳向礦業小鎮的廢棄工廠。",
    clue: {
      label: "取得線索｜維修紀錄",
      title: "異常脈衝的移動方向",
      detail: "避難所 → 運輸線 → 礦業小鎮・廢棄工廠",
    },
  },
  {
    speaker: "ethan",
    text: "訊號強度沒有隨距離衰減。它不是從這裡擴散出去的；源頭還在前方，而且正在啟動某個大型設備。",
  },
  {
    speaker: "claire",
    text: "等一下……脈衝裡有一段規律的閃光。像是有人在黑暗中，一遍又一遍地呼救。",
  },
  {
    speaker: "leo",
    text: "那就不能停在這裡了。先回基地把紀錄交給大家，再去礦業小鎮查清楚！",
  },
  {
    speaker: "narrator",
    text: "遠處的機械輪廓在黑暗中亮起。小隊的下一個目的地，已經出現。",
    clue: {
      label: "第二章｜礦業小鎮",
      title: "廢棄工廠的異常訊號",
      detail: "黑暗工程機甲的訊號正在甦醒。",
      image: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/7.BOSS/BOSS_06-BOSS-normal.png",
    },
  },
];
