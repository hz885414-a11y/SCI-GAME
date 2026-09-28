export interface ProloguePage {
  id: number;
  title: string;
  paragraphs: { text: string; emphasis?: boolean }[];
  /** Optional chapter-internal beats. A page without segments displays its paragraphs at once. */
  segments?: { paragraphs: { text: string; emphasis?: boolean }[] }[];
  backgroundImage: string | null;
  characterImage: string | null;
}

// Edit page order, copy, and image paths here. Null images use the built-in
// visual placeholder; each page can be configured independently.
export const prologuePages: ProloguePage[] = [
  {
    id: 1,
    title: "黑暗正在蔓延",
    backgroundImage: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/8.chapter/chapter_%20%281%29.jpg",
    characterImage: null,
    paragraphs: [],
    segments: [
      {
        paragraphs: [
          { text: "很久以來，人類一直相信——" },
          { text: "光的存在，就是黑暗的消失。", emphasis: true },
          { text: "直到某一天，一群研究者提出了一個顛覆世界的理論。" },
        ],
      },
      {
        paragraphs: [
          { text: "他們發現，這個世界並不是由「光」單獨構成。" },
          { text: "所有我們看見的明亮與陰影，其實都是兩股力量共同作用後的結果。" },
          { text: "光與黑暗", emphasis: true },
          { text: "它們並非彼此相反，而是如同兩個方向不同的向量，共同決定了這個世界最終呈現的樣貌。" },
        ],
      },
      {
        paragraphs: [
          { text: "當研究團隊成功分離其中未知的那一部分後——" },
          { text: "人類第一次證明了，在光所能觸及的世界之外，還存在著另一種力量。" },
          { text: "他們稱它為——" },
          { text: "「暗物質」。", emphasis: true },
        ],
      },
      {
        paragraphs: [
          { text: "但人類並沒有因此停下腳步。" },
          { text: "既然我們能控制光，那麼……" },
          { text: "為什麼不能連黑暗也一起控制？", emphasis: true },
          { text: "於是，人們開始捕捉暗物質、儲存暗物質，甚至試圖將它轉化為全新的能源。" },
        ],
      },
      {
        paragraphs: [
          { text: "直到他們發現——暗物質會吸收人類的焦慮、疲憊、失落與憤怒。" },
          { text: "而每一次負面情緒，都讓它變得更加強大。" },
          { text: "最終……人類創造出的，早已不再只是一種能源。" },
          { text: "黑暗，開始有了自己的意識。", emphasis: true },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "世界的失控",
    backgroundImage: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/8.chapter/chapter_%20%282%29.jpg",
    characterImage: null,
    paragraphs: [],
    segments: [
      {
        paragraphs: [
          { text: "一開始，人們以為那只是一場實驗事故。" },
          { text: "但很快，他們發現——" },
          { text: "黑暗，正在擴散。", emphasis: true },
        ],
      },
      {
        paragraphs: [
          { text: "它沿著城市的電網、工廠與交通系統蔓延。" },
          { text: "燈光開始異常閃爍，設備接連失效，世界各地陸續出現無法解釋的停電。" },
          { text: "更可怕的是——" },
        ],
      },
      {
        paragraphs: [
          { text: "黑暗似乎正在學習人類。" },
          { text: "它開始模仿恐懼、憤怒與焦慮，並將這些情緒重新放大，傳回人群之中。" },
          { text: "恐慌讓黑暗成長。" },
          { text: "而黑暗，又製造更多恐慌。" },
        ],
      },
      {
        paragraphs: [
          { text: "這形成了一個無法停止的循環。" },
          { text: "城市逐漸陷入混亂。" },
          { text: "道路失去照明，工廠停止運作，通訊中斷，救援系統也開始癱瘓。" },
        ],
      },
      {
        paragraphs: [
          { text: "最後，人們終於明白——" },
          { text: "這已經不是能源失控。" },
          { text: "也不是單純的災害。" },
          { text: "這個世界，正在被黑暗吞噬。", emphasis: true },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "任務代號：FW",
    backgroundImage: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/8.chapter/chapter_%20%283%29.jpg",
    characterImage: null,
    paragraphs: [],
    segments: [
      {
        paragraphs: [
          { text: "面對不斷擴散的黑暗，" },
          { text: "一間與「光」相伴超過 70 年的工廠——台南 SCI 啟動了一項特殊計畫。" },
          { text: "代號——" },
        ],
      },
      {
        paragraphs: [
          { text: "FW：勇敢の燈燈小隊", emphasis: true },
          { text: "讓光，即使在最惡劣的環境中，也能持續亮著。", emphasis: true },
        ],
      },
      {
        paragraphs: [
          { text: "工程師重新整合照明技術、能源系統與機器人裝備，打造能夠深入黑暗區域的特殊行動單位。" },
          { text: "因為他們始終相信——" },
        ],
      },
      {
        paragraphs: [
          { text: "黑暗或許能讓城市失去光明，卻無法阻止人類再次將光點亮。" },
          { text: "只要還有一盞燈持續亮著，失控的黑暗，就仍有被驅散的可能。" },
          { text: "於是——" },
        ],
      },
      {
        paragraphs: [
          { text: "FW：勇敢の燈燈小隊，正式啟動！", emphasis: true },
          { text: "我們將一起帶著光，前往黑暗最深的地方。" },
        ],
      },
    ],
  },
];
