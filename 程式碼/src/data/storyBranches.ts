import type { ChapterTransitionBeat } from "./chapterTransitions";
import { MAIN_STORY_SCENES } from "./mainStory";
import { editStoryBeat, type StoryTextOverrides } from "./storyText";

export type StoryChoices = Partial<Record<2 | 3 | 4 | 5 | 6, string>>;
type Choice = { id: string; label: string; beats: ChapterTransitionBeat[] };
type Branch = { after: number; prompt: ChapterTransitionBeat; choices: Choice[]; omitAfter?: number };

export const STORY_BRANCHES: Record<2 | 3 | 4 | 5, Branch> = {
  2: {
    after: 6,
    prompt: { speaker: "leo", text: "它還在回應。現在怎麼處理？", choice: [
      { id: "answer", label: "回應那個聲音，記下它說的話" },
      { id: "sample", label: "保持距離，封鎖現場並採樣" },
    ] },
    choices: [
      { id: "answer", label: "回應那個聲音，記下它說的話", beats: [
        { speaker: "claire", text: "我們沒有要把你丟下。你在等誰？" },
        { speaker: "narrator", text: "暗物質微微顫動，只重複了『回來』兩個字。它沒有攻擊，聲音卻像是在害怕。" },
        { speaker: "leo", text: "對話到這裡。記錄保存好，撤退時不要讓它離開隔離區。" },
      ] },
      { id: "sample", label: "保持距離，封鎖現場並採樣", beats: [
        { speaker: "leo", text: "先設警戒線。沒有人知道這聲音會不會把我們引進陷阱。" },
        { speaker: "ethan", text: "外層樣本取得了，核心沒有受損。聲音停止了，但波形還在回應我們的動作。" },
        { speaker: "claire", text: "至少留下座標。等我們有安全的方法，再回來聽它說完。" },
      ] },
    ],
  },
  3: {
    after: 11,
    prompt: { speaker: "narrator", text: "研究所開始自動封鎖。第五人的原始紀錄仍在深處，撤離路線只剩幾分鐘。小隊要先做什麼？", choice: [
      { id: "archive", label: "保存原始紀錄，再從備用通道撤離" },
      { id: "evacuate", label: "先讓所有人撤離，放棄深處的資料" },
    ] },
    choices: [
      { id: "archive", label: "保存原始紀錄，再從備用通道撤離", beats: [
        { speaker: "leo", text: "我守住通道。Ethan，複製原始紀錄；Claire，留意隔離室裡還有沒有人。" },
        { speaker: "ethan", text: "拿到了。第五欄的姓名仍被覆寫，但原始情緒波形完整。這會幫我們確認消除到底帶走了什麼。" },
        { speaker: "claire", text: "走！我們沒有救回那個名字，但至少沒有再讓他的痕跡消失。" },
      ] },
      { id: "evacuate", label: "先讓所有人撤離，放棄深處的資料", beats: [
        { speaker: "leo", text: "資料可以再查，人不能重來。所有人跟著我，現在撤離。" },
        { speaker: "narrator", text: "封鎖門在小隊身後合上。第五人的原始紀錄留在研究所，手邊只剩不完整的副本。" },
        { speaker: "ethan", text: "我明白這個決定。但沒有原始波形，之後的穩定研究會多一層不確定性。" },
      ] },
    ],
  },
  4: {
    after: 9,
    omitAfter: 13,
    prompt: { speaker: "leo", text: "壓力還在上升。現在由你決定，要繼續維持隔離，還是立刻切斷裝置？", choice: [
      { id: "stabilize", label: "守住隔離，讓 Ethan 完成測試" },
      { id: "shutdown", label: "切斷裝置，先確保大家安全" },
    ] },
    choices: [
      { id: "stabilize", label: "守住隔離，讓 Ethan 完成測試", beats: [
        { speaker: "narrator", text: "小隊守住隔離線。Claire 的聲音讓波形慢慢平緩，壓力終於下降。" },
        { speaker: "ethan", text: "記錄完成！我們有一段可重複的小範圍穩定波形。它還不能直接用在城市，但至少有起點了。" },
        { speaker: "leo", text: "這次成功了。下一次要有更好的撤離方案，我不想把任何人的命押在十一分鐘上。" },
      ] },
      { id: "shutdown", label: "切斷裝置，先確保大家安全", beats: [
        { speaker: "leo", text: "全部後退。三、二、一——切斷能源。" },
        { speaker: "narrator", text: "黑色紋路停住，隔離槽恢復安靜。所有人平安，但關鍵的穩定波形在斷電前沒有記錄完整。" },
        { speaker: "ethan", text: "我們保住了人。資料不足以放大到城市規模，之後只能另找方法。" },
      ] },
    ],
  },
  5: {
    after: 7,
    omitAfter: 9,
    prompt: { speaker: "leo", text: "城市系統正在報警，而她還抱著那件外套。現在先做哪件事？", choice: [
      { id: "listen", label: "留下來聽居民說完，記錄她的意願" },
      { id: "system", label: "先處理全城系統，避免異常擴大" },
    ] },
    choices: [
      { id: "listen", label: "留下來聽居民說完，記錄她的意願", beats: [
        { speaker: "claire", text: "你不用現在想起所有事。只要告訴我，這件外套為什麼還在你身邊。" },
        { speaker: "narrator", text: "居民沉默很久，終於說：『如果那是我的難過，請不要再替我拿走。』她同意把這句話與自己的紀錄交給小隊。" },
        { speaker: "ethan", text: "我們有了當事人的意願。接下來仍要確保系統安全，不能讓情緒一次全部湧回。" },
      ] },
      { id: "system", label: "先處理全城系統，避免異常擴大", beats: [
        { speaker: "leo", text: "先阻止警報擴散。Claire，帶居民離開控制區。" },
        { speaker: "narrator", text: "小隊及時穩住城市系統。再回到紀念牆時，那名居民已經離開；她的意願沒有被記錄下來。" },
        { speaker: "claire", text: "我們救了眼前的人。可是如果要把感受還給她，我希望有一天能先問她願不願意。" },
      ] },
    ],
  },
};

export const STORY_ENDINGS: Record<string, ChapterTransitionBeat[]> = {
  purge: [
    { speaker: "leo", text: "全員撤到光能屏障後。這一次，我們確定要把擴散徹底停下來。" },
    { speaker: "ethan", text: "淨化程序啟動。核心讀數歸零了……連那些情緒殘響也一起消失。" },
    { speaker: "claire", text: "城裡的燈亮了。她還留著那件外套，卻再也不會知道自己為什麼抱著它。" },
    { speaker: "narrator", text: "戰後，Leo 留在光明城重建防線，成為眾人信任的守護者；每次見到那些無緣無故的笑容，他仍會停下腳步。" },
    { speaker: "narrator", text: "Ethan 封存淨化資料，繼續查找被一同抹去的記憶；Claire 陪茉保管女兒的外套，即使再也無法替她找回那份悲傷。" },
    { speaker: "narrator", text: "世界恢復和平。人們平安地生活，失去的悲傷與部分記憶卻沒有回來。三人知道，這場勝利留下了一個無法填補的空白。", clue: { label: "結局｜無影之日", title: "和平之後，仍有缺口", detail: "暗物質被清除，世界安全；與它相連的情緒也永遠消失。" } },
  ],
  coexist: [
    { speaker: "ethan", text: "原始波形、穩定紀錄、居民的同意都在。分段恢復開始，先讓黑暗能量與人的情緒分離。" },
    { speaker: "leo", text: "外圍屏障穩住了。接下來不會一夜之間變好，但我們能陪他們走。" },
    { speaker: "claire", text: "她想起女兒穿著那件外套的樣子，終於哭了。她說：『很痛，但我不想忘記她。』" },
    { speaker: "narrator", text: "Leo 帶隊守護逐步恢復的城市，學會在有人落淚時先留下來聽；Ethan 與居民共同維護穩定裝置，公開每一次風險與成果。" },
    { speaker: "narrator", text: "Claire 在城裡設立記憶室，陪人們找回悲傷，也找回悲傷裡的愛。茉帶著女兒的外套走進來，終於能說出她的名字。" },
    { speaker: "narrator", text: "暗物質不再被當成必須抹除的敵人。人們學會控制它，也學會與自己的痛苦相處。夜空重新有了星光；每一顆都照見一段值得記住的生命。", clue: { label: "結局｜繁星時代", title: "帶著傷痛與愛，繼續活著", detail: "穩定技術逐步歸還情緒；共存需要長久的照護與承擔。" } },
  ],
  seal: [
    { speaker: "leo", text: "封鎖門準備合上。這不是解答，是我們替所有人爭取的時間。" },
    { speaker: "ethan", text: "核心與城市斷開了。外洩暫停，但那些情緒還留在裡面；我們必須繼續研究。" },
    { speaker: "claire", text: "今天我們沒能把它們帶回來。我會記住那些聲音，直到有人能安全地打開這扇門。" },
    { speaker: "narrator", text: "Leo 留在封鎖線指揮輪值，不讓任何人獨自承受風險；Ethan 建立公開研究檔案，尋找不用清除情緒的安全方法。" },
    { speaker: "narrator", text: "Claire 持續探訪茉與其他居民，記下他們想保留的故事。三人約定，等到能安全開門的那天，要讓每個人自己決定要不要取回記憶。" },
    { speaker: "narrator", text: "世界暫時安靜。中央核心被封存，危機沒有消失，也沒有繼續蔓延。下一代將繼承一扇緊閉的門，和仍待回答的問題。", clue: { label: "結局｜封存之環", title: "把答案留給未來", detail: "核心被隔離；被困住的情緒尚未歸還。" } },
  ],
};

export function getStoryBeats(chapter: number, choices: StoryChoices, overrides: StoryTextOverrides = {}): ChapterTransitionBeat[] {
  const scene = MAIN_STORY_SCENES[chapter];
  if (!scene) return [];
  const base = [...scene.beats];
  if (chapter === 3) {
    base[0] = { speaker: "narrator", text: choices[2] === "answer"
      ? "那個聲音回答了小隊。Claire 帶著完整對話紀錄來到零號研究所；舊門禁仍在運作。"
      : "小隊帶著隔離採樣的波形來到零號研究所。那個沒說完的聲音，仍留在工廠深處；舊門禁還在運作。" };
  }
  if (chapter === 4 && choices[3] === "evacuate") {
    base[0] = { speaker: "narrator", text: "小隊沒有取得第五人的原始紀錄，只能拿著不完整的副本到地下基地尋找其他方法。舊控制室仍有電。" };
  }
  if (chapter === 5 && choices[4] === "shutdown") {
    base[0] = { speaker: "narrator", text: "地下基地的實驗已安全終止，波形卻沒能記錄完整。小隊帶著尚未完成的方案來到曙光城－布萊梅；街上每個人都在微笑。" };
  }
  if (chapter === 6) {
    const canCoexist = choices[2] === "answer" && choices[3] === "archive" && choices[4] === "stabilize" && choices[5] === "listen";
    const missing = [
      choices[2] !== "answer" && "那個聲音的回答",
      choices[3] !== "archive" && "第五人的原始紀錄",
      choices[4] !== "stabilize" && "完整的穩定波形",
      choices[5] !== "listen" && "居民親口說出的意願",
    ].filter(Boolean).join("、");
    const prompt: ChapterTransitionBeat = {
      speaker: "leo",
      text: canCoexist
        ? "所有準備都在這裡。核心只剩一次操作機會；我們現在要怎麼做？"
        : `我們還缺${missing}，無法安全地讓情緒逐步回來。核心只剩一次操作機會；我們現在要怎麼做？`,
      choice: [
        { id: "purge", label: "啟動光能淨化，阻斷擴散" },
        ...(canCoexist ? [{ id: "coexist", label: "啟動分段穩定，讓情緒逐步回來" }] : []),
        { id: "seal", label: "封閉核心，爭取研究時間" },
      ],
    };
    const head = base.slice(0, 7).map((beat, index) => editStoryBeat(overrides, `chapter.6.common.${index}`, beat));
    const picked = choices[6];
    const editedPrompt = editStoryBeat(overrides, "chapter.6.prompt", prompt);
    return picked && STORY_ENDINGS[picked] && (picked !== "coexist" || canCoexist)
      ? [...head, editedPrompt, ...STORY_ENDINGS[picked].map((beat, index) => editStoryBeat(overrides, `ending.${picked}.${index}`, beat))]
      : [...head, editedPrompt];
  }
  const branch = STORY_BRANCHES[chapter as 2 | 3 | 4 | 5];
  if (!branch) return scene.beats;
  const head = base.slice(0, branch.after + 1).map((beat, index) => editStoryBeat(overrides, `chapter.${chapter}.common.${index}`, beat));
  const picked = branch.choices.find((choice) => choice.id === choices[chapter as 2 | 3 | 4 | 5]);
  const prompt = editStoryBeat(overrides, `chapter.${chapter}.prompt`, branch.prompt);
  if (!picked) return [...head, prompt];
  const tail = base.slice((branch.omitAfter ?? branch.after) + 1);
  if (chapter === 5 && choices[4] !== "stabilize" && tail[0]) {
    tail[0] = { speaker: "ethan", text: "第四章的波形還不完整。要讓全城逐步恢復，我們仍缺少安全的控制方法。" };
  }
  const editedTail = tail.map((beat, index) => editStoryBeat(overrides, `chapter.${chapter}.common.${(branch.omitAfter ?? branch.after) + 1 + index}`, beat));
  return [...head, prompt, ...picked.beats.map((beat, index) => editStoryBeat(overrides, `chapter.${chapter}.choice.${picked.id}.${index}`, beat)), ...editedTail];
}
