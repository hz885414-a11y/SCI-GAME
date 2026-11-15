import type { ChapterTransitionBeat } from "./chapterTransitions";

export interface MainStoryScene {
  chapter: number;
  title: string;
  finishLabel: string;
  beats: ChapterTransitionBeat[];
}

// Common-route story. Gameplay triggers and final branch outcomes remain separate decisions.
export const MAIN_STORY_SCENES: Record<number, MainStoryScene> = {
  2: {
    chapter: 2,
    title: "第二章｜不能消除的聲音",
    finishLabel: "保存紀錄・返回基地",
    beats: [
      { speaker: "narrator", text: "礦業小鎮的三處核心逐一熄滅。廢棄工廠恢復安靜，守護者留下的三句話卻仍在通訊頻道裡迴響。" },
      { speaker: "claire", text: "『等了好久』、『什麼時候回來』、『不是說好了』……那些話不是戰鬥訊號。有人真的在等。" },
      { speaker: "ethan", text: "等等，工廠深處還有一個反應。頻率跟剛才的核心相同，但光束照上去，讀數完全沒有下降。" },
      { speaker: "leo", text: "全員退到我後面。Ethan，先關掉第二次照射；我們不知道它會怎麼反應。" },
      { speaker: "narrator", text: "黑色物質在光裡緩緩收縮，沒有消散。一個破碎的聲音從裡面傳出。", clue: { label: "異常個體｜未消除", title: "『你們……也要把我留下嗎？』", detail: "光能淨化無效。聲音來源尚未確認。" } },
      { speaker: "claire", text: "它聽得到我們。Leo，它剛剛用的是『我』。" },
      { speaker: "ethan", text: "儀器只確認黑暗能量，還有另一組像記錄殘響的波形。我不能斷言裡面是人，也不能說它只是機器。" },
      { speaker: "leo", text: "先撤離，封鎖座標。誰都不要單獨接近它。我們回基地，把原始資料交給研究室。" },
      { speaker: "narrator", text: "基地研究室裡，波形在螢幕上反覆重播。每次播放，聲音都停在同一個字。" },
      { speaker: "ethan", text: "它不是現場錄音。訊號會隨我們的提問改變；但每次開啟淨化器，反應都變得更微弱。" },
      { speaker: "leo", text: "如果把這東西帶回基地，整座基地都可能有危險。先做遠端觀測。" },
      { speaker: "claire", text: "如果留在那裡，它可能一直等下去。能不能先問清楚：它到底在等誰？" },
      { speaker: "ethan", text: "我可以做一個隔離式採樣裝置，只取外層訊號，不碰核心。需要更多資料；來源可能在零號研究所。" },
      { speaker: "leo", text: "好。採樣之前由我確認撤離路線，Claire 負責對話紀錄，Ethan 負責裝置。任何讀數越界就立即中止。" },
      { speaker: "narrator", text: "三人沒有得到答案，只帶回一個不能刪除的聲音，和通往零號研究所的舊檔案編號。", clue: { label: "下一站｜零號研究所", title: "一份被塗改的出勤紀錄", detail: "出勤欄位有五格；撤離名單只剩四個名字。" } },
    ],
  },
  3: {
    chapter: 3,
    title: "第三章｜不存在的第五人",
    finishLabel: "帶回證據・研究穩定方案",
    beats: [
      { speaker: "narrator", text: "零號研究所的門禁仍在運作。過期的通行證掃過讀卡器，螢幕卻顯示：第五名隊員，權限有效。" },
      { speaker: "leo", text: "名單上只有四個人。第五張通行證是誰的？" },
      { speaker: "ethan", text: "資料沒有被刪乾淨。出勤計數是五，撤離計數是四；姓名欄被覆寫了，時間戳還在。" },
      { speaker: "claire", text: "如果是普通的資料損毀，為什麼只有這個人的名字不見？他們連想起這個人都做不到嗎？" },
      { speaker: "narrator", text: "備份室留下最後一段實驗記錄：暗物質吸收外來的黑暗能量，也會與人的強烈負面情緒產生共振。" },
      { speaker: "ethan", text: "這裡寫的是『吸收』，不是『製造』。恐懼、悲傷、憤怒會在裡面留下可測量的痕跡。" },
      { speaker: "leo", text: "先不要推論。把消除前後的醫療紀錄調出來。" },
      { speaker: "narrator", text: "同一批受試者在淨化後情緒平穩，卻無法說出自己曾經為何難過。有人記得事故發生，卻不記得失去摯友時的悲傷。" },
      { speaker: "claire", text: "他知道朋友死了，卻說那只是『一件事』。不是傷口好了，是他連傷口曾經疼過都不記得。" },
      { speaker: "ethan", text: "比對結果一致。消除承載情緒的暗物質時，相關的痛苦感受也跟著消失。部分個案連情緒連結的記憶都變得模糊。" },
      { speaker: "leo", text: "所以我們以前每按一次淨化，就可能替別人決定了哪些感受可以留下。" },
      { speaker: "claire", text: "悲傷很難受。但如果有人替我拿走它，我也會失去我曾經那麼愛一個人的證明。" },
      { speaker: "ethan", text: "我們需要重新檢查所有紀錄。第五人的缺席也許跟這項實驗有關；現在還不能把兩件事畫上等號。" },
      { speaker: "leo", text: "把證據帶回去。從現在開始，遇到這種個體先隔離、先確認，停止無差別消除。" },
      { speaker: "narrator", text: "螢幕最後顯示一個未完成的研究題目：『在不抹除情緒的情況下，抑制暗物質擴散。』", clue: { label: "核心發現", title: "消除的代價", detail: "被吸收的痛苦可能隨暗物質一同消失。第五人的真相仍待追查。" } },
    ],
  },
  4: {
    chapter: 4,
    title: "第四章｜留下痛苦的方法",
    finishLabel: "帶著穩定方案前往光明城",
    beats: [
      { speaker: "narrator", text: "地下基地的舊控制室仍有電。研究日誌記載過一次短暫的穩定實驗：暗物質沒有擴散，受試者的情緒也沒有消失。" },
      { speaker: "ethan", text: "原理不是把它鎖死，而是隔開黑暗能量的供應，再讓情緒殘響慢慢返回原本的人。" },
      { speaker: "leo", text: "『慢慢』是多久？外面的人等不了一場沒有期限的實驗。" },
      { speaker: "ethan", text: "我不知道。舊實驗只維持了十一分鐘，接著設備過熱。這不是已經成功的解法。" },
      { speaker: "claire", text: "可是那十一分鐘裡，受試者說了什麼？" },
      { speaker: "ethan", text: "他說：『我想起來了。我很難過，但那是我的。』" },
      { speaker: "narrator", text: "警報突然響起。隔離槽的壓力上升，黑色紋路沿著玻璃爬向控制台。" },
      { speaker: "leo", text: "Claire，撤到安全線外。Ethan，我來切斷能源，你只管保住紀錄。" },
      { speaker: "claire", text: "等等，波形不是在攻擊。它在重複那十一分鐘的節奏。讓我試著跟它說話。" },
      { speaker: "leo", text: "十秒。再高一格，我就斷電。" },
      { speaker: "claire", text: "我們聽見了。你不用把那段難過藏起來；先停在這裡，好嗎？" },
      { speaker: "narrator", text: "壓力下降。三人終於取得一段可重複的穩定波形，但只能在小範圍維持，還無法用於整座城市。" },
      { speaker: "ethan", text: "這是起點，不是答案。中央核心也許能放大穩定波形，但我們得先知道它對人會造成什麼。" },
      { speaker: "leo", text: "下一站，光明城。那裡有大規模淨化後的人群。我們去看結果，再決定能不能把裝置用在更多人身上。" },
      { speaker: "claire", text: "希望那裡的人，還能告訴我們他們真正的感受。", clue: { label: "暫定方案", title: "隔離黑暗能量，保留情緒", detail: "小範圍穩定成功；大規模效果與風險尚未確認。" } },
    ],
  },
  5: {
    chapter: 5,
    title: "第五章｜光明城",
    finishLabel: "前往中央核心",
    beats: [
      { speaker: "narrator", text: "曙光城－布萊梅的街道明亮整潔。每個人都微笑著向小隊問好；紀念牆前，也沒有人哭。" },
      { speaker: "claire", text: "那面牆上有他們失去的家人。他們會來獻花，卻說不出為什麼需要紀念。" },
      { speaker: "ethan", text: "城市的淨化紀錄沒有中斷過。情緒曲線幾乎是一條直線，連事故發生那天也是。" },
      { speaker: "leo", text: "平靜不一定是錯的。先問他們自己怎麼想。" },
      { speaker: "narrator", text: "一名居民說她每天都很幸福。她記得女兒離開那天的雨，卻想不起自己為什麼還留著女兒的外套。" },
      { speaker: "claire", text: "她把外套抱得那麼緊。身體還記得，心卻被人拿走了一塊。" },
      { speaker: "ethan", text: "淨化系統把痛苦壓到零，也把與它相連的情緒反應一起抹平。這不是單一個案。" },
      { speaker: "leo", text: "如果現在關掉系統，所有痛苦可能同時回來。不能讓整座城市承受一次失控。" },
      { speaker: "claire", text: "也不能因為害怕他們難過，就替他們永遠決定什麼都不許難過。" },
      { speaker: "ethan", text: "第四章的穩定波形或許能讓反應逐步恢復，但規模不夠。我們需要中央核心的控制權。" },
      { speaker: "leo", text: "先保護居民，記錄風險，再去核心。到了那裡，我們要給所有人一個能選擇的未來。" },
      { speaker: "narrator", text: "夜幕降下，整座城依然燈火通明。紀念牆前的花被風吹落，沒有人注意。", clue: { label: "光明城觀察", title: "沒有悲傷的快樂", detail: "城市安全表面之下，失去情緒的人也失去了理解自身記憶的能力。" } },
    ],
  },
  6: {
    chapter: 6,
    title: "第六章｜中央核心之前",
    finishLabel: "返回基地",
    beats: [
      { speaker: "narrator", text: "中央核心的光穿過整座城市。控制台同時顯示兩組讀數：黑暗能量的擴散速度，以及被封存在其中的人類情緒殘響。" },
      { speaker: "ethan", text: "我們能碰到核心控制層了。消除程序可以迅速阻斷擴散；穩定程序能保留殘響，但需要分段執行，而且還有失敗風險。" },
      { speaker: "leo", text: "先把風險講完整。任何一步失控，外面的人會怎樣？" },
      { speaker: "ethan", text: "消除會讓那些痛苦再也回不來。穩定若失敗，黑暗能量可能重新外洩。我沒有一個零風險的答案。" },
      { speaker: "claire", text: "第二章那個聲音、研究所的第五人、光明城那件外套……它們都在提醒我們：讀數後面是人。" },
      { speaker: "leo", text: "我以前以為保護大家，就是把危險清除乾淨。現在我知道，有些東西被清掉後也無法補回。" },
      { speaker: "ethan", text: "我會把每個方案的後果留在控制台。任何決定都不能靠一句『一定沒事』來掩蓋代價。" },
      { speaker: "claire", text: "我們可以害怕，也可以難過。那不代表我們不夠勇敢。" },
      { speaker: "narrator", text: "核心等待輸入。三人望向彼此，沒有誰能替所有人輕易回答。最終方案與分支結果，將由後續選擇決定。", clue: { label: "劇情選擇點｜待定", title: "中央核心的命運", detail: "本段停在抉擇之前；具體選項與結局尚未定稿。" } },
    ],
  },
};
