export type TutorialSpeaker = "claire" | "ethan" | "leo" | "all";
export type TutorialTarget = "laboratory" | "robotAssembly" | "adventure" | "supply";

export interface TutorialDialogueLine {
  speaker: TutorialSpeaker;
  text: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  target: TutorialTarget | null;
  dialogue: TutorialDialogueLine[];
}

// Each step is a conversation beat. Add future facilities by appending a step
// with its target key and dialogue; Tutorial resolves the target from the DOM.
export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "小隊報到",
    target: null,
    dialogue: [
      { speaker: "claire", text: "好了！" },
      { speaker: "claire", text: "以上，就是現在這個世界正在發生的事。" },
      { speaker: "leo", text: "……是不是有一點危險有一點可怕？" },
      { speaker: "claire", text: "你不要嚇別人啦！" },
      { speaker: "leo", text: "阿 抱歉抱歉" },
      { speaker: "ethan", text: "不用擔心！" },
      { speaker: "ethan", text: "從現在開始，你就是我們燈燈小隊的一員啦！" },
      { speaker: "ethan", text: "接下來不管遇到什麼，我們都會一直在你身邊——" },
      { speaker: "ethan", text: "一起努力，把這個世界重新照亮！" },
      { speaker: "leo", text: "……物理上的那種喔。" },
      { speaker: "claire", text: "總之，在正式出任務之前，先帶你認識一下我們的基地吧！" },
      { speaker: "claire", text: "這裡可是我們對抗黑暗的秘密基地！" },
      { speaker: "claire", text: "走吧，先從第一個地方開始！" },
    ],
  },
  {
    id: "laboratory",
    title: "勇氣の實驗室",
    target: "laboratory",
    dialogue: [
      { speaker: "ethan", text: "這裡是我們最常待的地方——勇氣的實驗室！" },
      { speaker: "ethan", text: "平常沒出任務的時候，我們大部分時間都會待在這裡，測試新的燈燈、研究新的裝備，偶爾也會做一些奇怪的實驗。" },
      { speaker: "claire", text: "當然有空歡迎來這裡找我們聊聊天，有任何讓你困擾的問題，我們可以一起研究出更好的永久對策！" },
      { speaker: "claire", text: "之後這裡還會有更多研究課題和小測試，說不定你也能一起幫忙開發出更厲害的裝備！" },
      { speaker: "leo", text: "所以有空的話，記得來找我們喔！" },
      { speaker: "leo", text: "不管是想聊天，還是想一起做測試——" },
      { speaker: "leo", text: "隨時歡迎你！" },
    ],
  },
  {
    id: "robot-assembly",
    title: "機器人組裝區",
    target: "robotAssembly",
    dialogue: [
      { speaker: "ethan", text: "這裡是機器人組裝區！" },
      { speaker: "ethan", text: "冒險途中找到的小零件，都可以帶回這裡。" },
      { speaker: "ethan", text: "它將可以組成機器人的新裝備！" },
      { speaker: "claire", text: "所以就像我們一樣！每一顆小螺絲都有它存在的意義！" },
      { speaker: "leo", text: "但有些特別不重要？" },
      { speaker: "claire", text: "才不是！" },
      { speaker: "claire", text: "有些零件只是還沒找到最適合自己的位置而已。" },
      { speaker: "ethan", text: "對啊，少了一顆不起眼的小螺絲，整台機器人可能都會出問題。" },
      { speaker: "leo", text: "……好吧，那我收回剛剛那句。" },
      { speaker: "claire", text: "所以記得把每一個找到的零件都帶回來喔！" },
      { speaker: "ethan", text: "它將可以組成機器人的新裝備！" },
    ],
  },
  {
    id: "adventure",
    title: "營業冒險區",
    target: "adventure",
    dialogue: [
      { speaker: "leo", text: "這裡就是營業機動部！我們出任務都是從這裡開始！" },
      { speaker: "leo", text: "平常可以從『出發任務』前往受到黑暗侵蝕的區域。" },
      { speaker: "leo", text: "跟著我們一起冒險、收集散落的零件，再把它們帶回基地！" },
      { speaker: "claire", text: "收集到的零件，還可以拿去機器人組裝區開發新的裝備喔！" },
      { speaker: "ethan", text: "另外，這裡還有一個『任務中心』。" },
      { speaker: "ethan", text: "SCI參加世界各地的展覽時，發現黑暗的力量也滲透到各個展場" },
      { speaker: "ethan", text: "在海外任務中，用燈燈機器人迎戰更為強大的黑暗" },
      { speaker: "claire", text: "所以平常的每一次冒險，可都是在為下一場大任務做準備喔！" },
      { speaker: "leo", text: "總之——收集零件、強化裝備、然後去世界各地大鬧一場！" },
      { speaker: "ethan", text: "……是執行任務。" },
      { speaker: "leo", text: "對，執行任務。" },
    ],
  },
  {
    id: "supply",
    title: "採購補給區",
    target: "supply",
    dialogue: [
      { speaker: "claire", text: "最後是補給區！" },
      { speaker: "claire", text: "出發以前需要的東西，都可以來這裡準備。" },
      { speaker: "leo", text: "有些時候這裡還會有一些超讚的員工福利，記得有空的時候就來逛逛" },
      { speaker: "leo", text: "可能會有意想不到的驚喜！" },
    ],
  },
  {
    id: "goodbye",
    title: "歡迎加入小隊",
    target: null,
    dialogue: [
      { speaker: "ethan", text: "好啦！基地介紹就到這裡！" },
      { speaker: "ethan", text: "剩下的，就交給你自己慢慢探索吧。" },
      { speaker: "ethan", text: "準備好的話——" },
      { speaker: "all", text: "我們就一起出發！" },
      { speaker: "all", text: "歡迎加入，勇敢の燈燈小隊！" },
    ],
  },
];
