import React from "react";
import { Character, FORTUNE_SLIPS } from "../data/responses";
import { playSound } from "../utils/audio";
import { 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Lightbulb, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle 
} from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// SCI Portable Inspection Work Lamps definition
const SCI_PRODUCTS = [
  {
    model: "C2-929X",
    name: "C2-929X (Flexible Gooseneck Design)",
    engName: "Flexible Gooseneck Design",
    specs: {
      lightSource: "高亮度 COB LED / 前端聚焦光源",
      mounting: "360° 萬向可彎曲蛇形金屬軟管 & 強力磁性底座",
      power: "高容量鋰電池 / USB 安全快充"
    },
    url: "https://www.sci.com.tw/product-category/inspection-work-lamps/portable-inspection-lamps/",
    getConnection: (slipText: string) => {
      if (slipText.includes("大吉")) {
        return "這款擁有靈活蛇形軟管的 C2-929X 工作燈，正如感情中強韌又極富彈性的陪伴！無論身處任何刁鑽死角或難解的心防，它都能隨心彎曲、完美切入，溫柔照亮最幽暗的角落。";
      }
      if (slipText.includes("吉") || slipText.includes("暖光")) {
        return "隨意塑形的軟管設計，體現了戀愛溝通中極其珍貴的『傾聽與彈性』。C2-929X 提醒你適時調整姿態，用最貼心溫柔的角度切入他的心坎，照亮他的生活。";
      }
      if (slipText.includes("過載") || slipText.includes("電阻") || slipText.includes("斷電") || slipText.includes("摩擦")) {
        return "當關係阻抗偏高、疑慮過載時，C2-929X 的蛇形延伸功能提醒你：稍微拉開一點物理或心理距離，像軟管一樣靈活退讓，可以避開摩擦起火的危險核心。";
      }
      return "全能靈活的 C2-929X 代表生活中無處不在、最隨手適應的溫柔。不用刻意表現，隨手一折、穩健明亮，默默陪伴你們走過日常的每一寸軌道。";
    }
  },
  {
    model: "C2-927X",
    name: "C2-927X (270° Foldable Design)",
    engName: "270° Foldable Design",
    specs: {
      lightSource: "雙色溫高顯色 COB 光源 & 頂部聚焦手電筒",
      mounting: "270° 折疊式旋轉結構 & 底座強力釹磁鐵",
      power: "Type-C 快速充電 & 多段電量指示燈"
    },
    url: "https://www.sci.com.tw/product-category/inspection-work-lamps/portable-inspection-lamps/",
    getConnection: (slipText: string) => {
      if (slipText.includes("大吉")) {
        return "C2-927X 的 270° 旋轉功能，象徵著你今日無懈可擊的 360 度環繞魅力！無論對方在多麼隱密的暗角，你都能精準對焦，以強力釹磁鐵般的高能磁場將彼此牢牢吸引，戀愛電壓瞬間破表！";
      }
      if (slipText.includes("吉") || slipText.includes("暖光")) {
        return "270° 的靈活折疊折射，代表著相處時最高級的『體貼與調光』。適時變換角度、換位思考，如同 C2-927X 一般隨時切換到最適合對方的色溫與亮度，用細節默默守護。";
      }
      if (slipText.includes("過載") || slipText.includes("電阻") || slipText.includes("斷電") || slipText.includes("摩擦")) {
        return "當感情頻寬過載、冷戰僵持時，C2-927X 的折疊結構提醒你：適當的『折疊與收納』不代表軟弱，而是給彼此預留冷靜與修復的絕佳彈性空間。";
      }
      return "極佳的旋轉與定位性能，是平凡日常中最穩固的戀愛保險。C2-927X 讓生活中的感情頻寬和諧、照度均勻，讓彼此的好感度在舒適的電壓中持續看漲。";
    }
  },
  {
    model: "C2-932A",
    name: "C2-932A (Portable Inspection Lamp)",
    engName: "Portable Inspection Lamp",
    specs: {
      lightSource: "均勻防眩光高流明 COB 面光源",
      mounting: "口袋便攜筆夾 & 耐衝擊防滑橡膠手把",
      power: "AAA 高效能環保電池 / 長效省電迴路"
    },
    url: "https://www.sci.com.tw/product-category/inspection-work-lamps/portable-inspection-lamps/",
    getConnection: (slipText: string) => {
      if (slipText.includes("大吉")) {
        return "輕巧卻能發出高均勻度的光芒，正如你低調卻極具穿透力的個人特質！帶上 C2-932A 的自信，在關鍵時刻大方展現你的閃光點，給予對方最深切而耀眼的溫暖。";
      }
      if (slipText.includes("吉") || slipText.includes("暖光")) {
        return "C2-932A 的極致便攜，就如同如影隨行的貼心陪伴。在對方不經意的幽暗時刻隨時伸出援手，不用大張旗鼓，用最真誠安穩的溫和亮度，建立起最溫馨的安全防線。";
      }
      if (slipText.includes("過載") || slipText.includes("電阻") || slipText.includes("斷電") || slipText.includes("摩擦")) {
        return "當關係遭遇短路或高頻爭吵，C2-932A 提醒你：用溫和、不刺眼的防眩光照度慢慢解開彼此的心結。溫柔退讓與穩定照亮，即是重啟感情迴路的最佳公式。";
      }
      return "長效省電與輕盈防滑外殼，是感情路上最硬核的守護者。默默在你們的身後築起安全防火牆，不畏磨損與風雨，陪你們安穩走過日常。";
    }
  },
  {
    model: "C2-934A",
    name: "C2-934A (FIT Inspection Lampp)",
    engName: "FIT Inspection Lampp",
    specs: {
      lightSource: "超高流明聚焦 LED / 側邊大面積漫射燈",
      mounting: "人體工學舒適握把 & 雙向折疊掛鉤",
      power: "長效能鋰電池 / 支援反向應急供電 (Power Bank)"
    },
    url: "https://www.sci.com.tw/product-category/inspection-work-lamps/portable-inspection-lamps/",
    getConnection: (slipText: string) => {
      if (slipText.includes("大吉")) {
        return "C2-934A 具備極佳的『FIT』精準契合性與反向供電功能！這正是你今天元氣飽滿的縮影。不僅自己閃耀，更能用滿滿的正能量為對方充電，讓兩人的幸福頻率瞬間共鳴！";
      }
      if (slipText.includes("吉") || slipText.includes("暖光")) {
        return "『FIT』代表著愛情裡天生一對的契合。如同這款工作燈能完美貼合各種工作場景，貼心陪伴彼此安穩前行。";
      }
      if (slipText.includes("過載") || slipText.includes("電阻") || slipText.includes("斷電") || slipText.includes("摩擦")) {
        return "當關係陷入阻礙或電阻上升時，C2-934A 提醒你：感情需要雙方互相『FIT』適應，適時使用備用光源，有助於重新找回溫暖的交流。";
      }
      return "高續航與反向應急充電能力，是你們遇到考驗時最可靠的備用能源，守護愛意不中斷。";
    }
  },
  {
    model: "C2-936A",
    name: "C2-936A (LED Rechargeable Headlamp)",
    engName: "LED Rechargeable Headlamp",
    specs: {
      lightSource: "高亮度雙光源 LED 投光與聚光",
      mounting: "可調式防滑透氣頭帶 & 多角度旋轉卡榫",
      power: "智慧防護鋰電池 / Type-C 快速直充"
    },
    url: "https://www.sci.com.tw/product-category/inspection-work-lamps/portable-inspection-lamps/",
    getConnection: (slipText: string) => {
      if (slipText.includes("大吉")) {
        return "戴上 C2-936A 頭燈，象徵著你今日無所畏懼、勇往直前的核心光芒！雙手被徹底解放，心無旁騖地奔向心儀的他，用耀眼光束在前方指引，幸福一觸即發！";
      }
      if (slipText.includes("吉") || slipText.includes("暖光")) {
        return "頭燈代表專注與全心全意的凝視。不論日常多麼忙碌，C2-936A 都在提醒你：將關愛的視線聚焦在對方身上，不漏掉任何細微的情緒，用堅定不移的目光溫暖他的全世界。";
      }
      if (slipText.includes("過載") || slipText.includes("電阻") || slipText.includes("斷電") || slipText.includes("摩擦")) {
        return "當關係陷入迷霧或冷戰電阻時，C2-936A 的紅光警示與白光防護功能提醒你：冷靜排除干擾，戴上它，以最澄澈專注的視角一起除障，快速讓安全迴路導通！";
      }
      return "防滑透氣頭帶代表無負擔的長久相處。C2-936A 始終在你最需要的時候亮起，解放繁複的包袱，用最直接、真誠的照亮，守護每一天的安心幸福。";
    }
  },
  {
    model: "C2-931",
    name: "C2-931 (pen-type inspection lamp)",
    engName: "pen-type inspection lamp",
    specs: {
      lightSource: "高穿透性聚焦 LED 筆狀光源",
      mounting: "高彈性金屬筆夾 / 超輕量耐磨鋁合金筆身",
      power: "節能環保 AAA 電池規格"
    },
    url: "https://www.sci.com.tw/product-category/inspection-work-lamps/portable-inspection-lamps/",
    getConnection: (slipText: string) => {
      if (slipText.includes("大吉")) {
        return "C2-931 的筆型設計極致精巧卻穿透力十足，象徵你今日敏銳無比的直覺與精準戀愛攻勢！出手必中，在細節處大方展現體貼，瞬間擊中對方心防！";
      }
      if (slipText.includes("吉") || slipText.includes("暖光")) {
        return "筆型隨身攜帶，代表最貼近日常的『微小溫暖』。如同 C2-931 收納在胸前口袋，在最不起眼的小細節裡溫和發光，默默支持對方、溫柔陪伴，情商值拉滿。";
      }
      if (slipText.includes("過載") || slipText.includes("電阻") || slipText.includes("斷電") || slipText.includes("摩擦")) {
        return "面對冷戰或電阻，不要用刺眼的強光直射進逼。C2-931 的指向性微光提醒你：用最溫和、對焦精準的微細暖光慢慢解開彼此的心結，退讓與微調即是重啟電壓的良方。";
      }
      return "精緻耐用的鋁合金身，是感情裡歷久彌新的品質保證。C2-931 輕巧調節好感度，在微細的生活對焦中，讓驚喜 and 愛意源源不絕。";
    }
  }
];

// 1. TODAY'S FORTUNE SLIP (今日小籤) MODAL
interface FortuneModalProps extends ModalProps {
  initialSlipIndex?: number;
}

export const FortuneModal: React.FC<FortuneModalProps> = ({ isOpen, onClose }) => {
  const [drawnSlip, setDrawnSlip] = React.useState<{ text: string; color: string } | null>(null);
  const [recommendedProduct, setRecommendedProduct] = React.useState<typeof SCI_PRODUCTS[0] | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const parsedSlip = React.useMemo(() => {
    if (!drawnSlip) return { title: "", description: "" };
    const match = drawnSlip.text.match(/^【(.*?)】(.*)$/);
    if (match) {
      return {
        title: match[1],
        description: match[2]
      };
    }
    return {
      title: "",
      description: drawnSlip.text
    };
  }, [drawnSlip]);

  React.useEffect(() => {
    if (isOpen) {
      setDrawnSlip(null);
      setRecommendedProduct(null);
    }
  }, [isOpen]);

  const drawFortune = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setDrawnSlip(null);
    setRecommendedProduct(null);
    playSound("click");

    // Make an interactive shuffling audio sound
    let count = 0;
    const interval = setInterval(() => {
      playSound("typewriter");
      count++;
      if (count >= 15) {
        clearInterval(interval);
        const randomIdx = Math.floor(Math.random() * FORTUNE_SLIPS.length);
        const slip = FORTUNE_SLIPS[randomIdx];
        
        // Randomly recommend one of the SCI Portable Inspection Lamps
        const randomProdIdx = Math.floor(Math.random() * SCI_PRODUCTS.length);
        const product = SCI_PRODUCTS[randomProdIdx];

        setDrawnSlip(slip);
        setRecommendedProduct(product);
        setIsDrawing(false);
        playSound("fortune");
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-none shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col p-4 sm:p-6 text-zinc-100 max-h-[96vh] sm:max-h-[92vh] overflow-y-auto">
        
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-zinc-500 to-orange-500" />
        
        {/* Title */}
        <div className="flex items-center justify-between mb-3 sm:mb-6 border-b border-zinc-800/80 pb-2 sm:pb-3">
          <h3 className="font-sans font-bold text-sm sm:text-lg tracking-wider text-orange-400 flex items-center gap-2">
            ⚡ 今日戀愛保險籤 <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500">SAFETY_FUSE_TESTER</span>
          </h3>
          <button
            onClick={() => { playSound("click"); onClose(); }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-none border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white transition flex items-center justify-center text-zinc-400 font-bold cursor-pointer text-xs sm:text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 flex flex-col items-center justify-center py-1">
          {!drawnSlip ? (
            <div className="flex flex-col items-center gap-4 sm:gap-6 text-center py-2 sm:py-6 w-full">
              {/* Cool Cyberpunk Scientific Testing Fuse Probe visual instead of lucky bag */}
              <div className="relative w-28 h-28 sm:w-44 sm:h-44 flex items-center justify-center">
                {/* Glowing rotating gears/circuits */}
                <div className={`absolute inset-0 rounded-full border-2 border-dashed border-orange-500/30 animate-spin ${isDrawing ? "duration-200" : "duration-[4000ms]"}`} />
                <div className={`absolute inset-2 sm:inset-3 rounded-full border border-orange-500/10 animate-spin ${isDrawing ? "duration-300" : "duration-[6000ms]"}`} style={{ animationDirection: 'reverse' }} />
                
                {/* The glowing fuse element itself */}
                <div className="absolute w-20 h-8 sm:w-24 sm:h-10 bg-zinc-900 border-2 border-zinc-800 rounded-none flex items-center justify-between px-2 sm:px-2.5 shadow-[0_0_20px_rgba(245,158,11,0.08)] overflow-hidden">
                  {/* Metal end caps */}
                  <div className="w-1.5 sm:w-2 h-full bg-zinc-500 border-r border-zinc-700" />
                  
                  {/* Glowing fuse filament */}
                  <div className="flex-1 flex items-center justify-center relative h-full">
                    <div className={`h-[2px] w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 relative transition-all duration-300 ${isDrawing ? "animate-pulse scale-y-150 shadow-[0_0_12px_rgba(245,158,11,0.8)]" : "shadow-[0_0_4px_rgba(245,158,11,0.3)]"}`} />
                    {isDrawing && (
                      <span className="absolute text-orange-400 text-[9px] sm:text-[10px] animate-ping font-mono">⚡</span>
                    )}
                  </div>
                  
                  <div className="w-1.5 sm:w-2 h-full bg-zinc-500 border-l border-zinc-700" />
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <p className="font-sans font-medium text-xs sm:text-sm text-zinc-300">「測量今天的感情電阻與熔斷保險係數吧！」</p>
                <p className="text-[8px] sm:text-[10px] text-zinc-500 font-mono tracking-wider">SYSTEM READY // CLICK TO TEST ENERGY OVERLOAD RESISTANCE</p>
              </div>

              <button
                onClick={drawFortune}
                disabled={isDrawing}
                className={`w-full py-2.5 sm:py-3.5 px-4 sm:px-6 font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-none transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer
                  ${isDrawing 
                    ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" 
                    : "bg-white hover:bg-orange-500 text-black hover:text-white"
                  }
                `}
              >
                {isDrawing ? "⚡ 正在檢測戀愛保險迴路..." : "🔮 開始保險絲電阻檢測"}
              </button>
            </div>
          ) : (
            // Fortune Reveal and SCI Product recommendation display
            <div className="w-full text-center space-y-3 sm:space-y-5 animate-scale-up flex-1 flex flex-col justify-between">
              
              {/* Slip Card */}
              <div className="p-3 sm:p-5 rounded-none border border-zinc-800 bg-zinc-950/80 text-zinc-100 font-bold text-xs sm:text-sm leading-relaxed tracking-wide shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                {/* Micro tech grid background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
                
                {/* Decorative border glow */}
                <div className={`absolute -inset-px bg-gradient-to-r ${drawnSlip.color} opacity-10 group-hover:opacity-20 transition duration-500 pointer-events-none`} />

                {/* Decorative brackets label */}
                <div className="absolute top-2 left-3 font-mono text-[8px] sm:text-[9px] text-zinc-500/90 flex items-center gap-1 z-10">
                  <Zap className="w-2.5 h-2.5 text-orange-500 animate-pulse" />
                  <span>[ LOVERS_LAB_DIAGNOSIS_OUTPUT ]</span>
                </div>
                <div className="absolute bottom-2 right-3 font-mono text-[8px] sm:text-[9px] text-zinc-500 opacity-60 z-10 hidden xs:block">[ OUT_STATUS: COMPLETE ]</div>
                
                <div className="py-2 sm:py-4 px-1 mt-2 flex flex-col items-center gap-3 sm:gap-5 text-center relative z-10">
                  {parsedSlip.title && (
                    <div className="relative flex flex-col items-center select-none animate-scale-up">
                      {/* Big ambient glow behind title */}
                      <div className={`absolute -inset-2 bg-gradient-to-r ${drawnSlip.color} opacity-20 blur-md rounded-none`} />
                      
                      {/* Main Title Badge Container */}
                      <div className="relative flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-black/95 border border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        {/* Glowing corner bracket lines */}
                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-zinc-500" />
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-zinc-500" />
                        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-zinc-500" />
                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-zinc-500" />
                        
                        {/* Brackets styled with gradient */}
                        <span className={`text-base sm:text-xl md:text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r ${drawnSlip.color} tracking-tight select-none`}>
                          【
                        </span>
                        
                        {/* Inner text content styled with grand gradient */}
                        <span className={`text-xs sm:text-sm md:text-base font-sans font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${drawnSlip.color} uppercase px-0.5`}>
                          {parsedSlip.title}
                        </span>
                        
                        <span className={`text-base sm:text-xl md:text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r ${drawnSlip.color} tracking-tight select-none`}>
                          】
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Description of the slip */}
                  <p className="text-zinc-200 text-xs sm:text-sm md:text-base leading-relaxed font-semibold max-w-md px-1 sm:px-3 font-sans transition-all duration-300">
                    {parsedSlip.description}
                  </p>
                </div>
              </div>

              {/* Correlated SCI Product Recommendation Area */}
              {recommendedProduct && (
                <div className="border border-amber-500/20 bg-amber-500/[0.02] p-2.5 sm:p-4 text-left rounded-none space-y-1.5 sm:space-y-3 relative overflow-hidden">
                  {/* Decorative badge corner */}
                  <div className="absolute top-0 right-0 bg-amber-500/10 px-1.5 sm:px-2.5 py-0.5 border-l border-b border-amber-500/20 text-[7px] sm:text-[8px] font-mono text-amber-400 tracking-widest uppercase">
                    SCI RECOMMENDED
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="font-mono text-[8px] sm:text-[10px] text-zinc-400 tracking-wider">今日推薦防護裝備 // SCI_PORTABLE_LIGHT</span>
                  </div>

                  {/* Product Header */}
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] sm:text-xs font-bold text-amber-400 tracking-wide font-sans">
                      {recommendedProduct.name}
                    </h4>
                    <p className="text-[8px] sm:text-[9px] text-zinc-500 font-mono italic">
                      Model: {recommendedProduct.model} // {recommendedProduct.engName}
                    </p>
                  </div>

                  {/* Specifications list - hidden on mobile to fit screen */}
                  <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/40 p-2.5 border border-zinc-900/60 font-sans text-[10px] text-zinc-400">
                    <div>
                      <span className="text-zinc-500 block">💡 核心光源：</span>
                      <span className="text-zinc-300 font-medium">{recommendedProduct.specs.lightSource}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">🧲 定位與裝配：</span>
                      <span className="text-zinc-300 font-medium">{recommendedProduct.specs.mounting}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">🔋 動力驅動：</span>
                      <span className="text-zinc-300 font-medium">{recommendedProduct.specs.power}</span>
                    </div>
                  </div>

                  {/* Association explanation text */}
                  <div className="text-[10px] sm:text-[11px] text-zinc-300 leading-relaxed border-l-2 border-amber-500/40 pl-2 sm:pl-3.5 py-0.5 sm:py-1">
                    <span className="font-bold text-amber-400/90 font-sans block mb-0.5 text-[9px] sm:text-[11px]">🛠️ 戀愛電路關聯分析：</span>
                    {recommendedProduct.getConnection(drawnSlip.text)}
                  </div>

                  {/* Official product URL CTA Button */}
                  <div className="pt-0.5 sm:pt-1.5 flex justify-end">
                    <a
                      href={recommendedProduct.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-zinc-900 hover:bg-amber-500 text-zinc-400 hover:text-black border border-zinc-800 hover:border-amber-400 font-mono text-[8px] sm:text-[9px] tracking-wider font-bold transition duration-200"
                    >
                      <span>前往 SCI 官網查看手持工作燈系列</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Custom bottom tip - hidden on mobile to guarantee no-scroll fitting */}
              <div className="hidden xs:block space-y-1 bg-zinc-950 border border-zinc-900 p-2 sm:p-3.5 text-left rounded-none">
                <p className="text-[8px] sm:text-[10px] text-zinc-400 font-medium leading-relaxed flex items-start gap-1 sm:gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    ❖ <span className="font-bold text-zinc-200">安全迴路診斷：</span>
                    本系統安全檢測係依據 SCI 工業物理光學與防護標準隨機共振。大吉可全載輸出能量；短路、過載或遇到阻抗，請依推薦裝備進行手動除障。
                  </span>
                </p>
              </div>

              {/* Footer action options */}
              <div className="flex gap-2 sm:gap-3 pt-1">
                <button
                  onClick={drawFortune}
                  className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-none border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 font-bold text-[10px] sm:text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>🔄 重新檢測 (RE_TEST)</span>
                </button>
                <button
                  onClick={() => { playSound("click"); onClose(); }}
                  className="flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-none bg-white text-black font-bold text-[10px] sm:text-xs tracking-wider hover:bg-orange-500 hover:text-white transition cursor-pointer"
                >
                  👌 匯入安全參數並返回 (SYNC)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// 2. HOW TO PLAY (遊戲說明) MODAL
export const InstructionsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<"intro" | "members" | "keywords">("intro");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-zinc-950 border border-zinc-800 rounded-none shadow-[0_0_50px_rgba(56,189,248,0.15)] flex flex-col p-6 text-zinc-100 max-h-[85vh]">
        
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-zinc-500 to-orange-500" />
        
        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans font-bold text-lg tracking-wider text-orange-400 flex items-center gap-2">
            📘 實驗室運作說明書 <span className="text-[10px] font-mono text-zinc-500">OPERATIONAL_MANUAL</span>
          </h3>
          <button
            onClick={() => { playSound("click"); onClose(); }}
            className="w-8 h-8 rounded-none border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white transition flex items-center justify-center text-zinc-400 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 mb-4 font-sans text-xs">
          <button
            onClick={() => { playSound("click"); setActiveTab("intro"); }}
            className={`flex-1 py-2 font-bold text-center border-b-2 transition rounded-none cursor-pointer
              ${activeTab === "intro" ? "text-orange-400 border-orange-500" : "text-zinc-400 border-transparent hover:text-zinc-200"}
            `}
          >
            🌐 諮商室起源
          </button>
          <button
            onClick={() => { playSound("click"); setActiveTab("members"); }}
            className={`flex-1 py-2 font-bold text-center border-b-2 transition rounded-none cursor-pointer
              ${activeTab === "members" ? "text-orange-400 border-orange-500" : "text-zinc-400 border-transparent hover:text-zinc-200"}
            `}
          >
            👥 成員介紹
          </button>
          <button
            onClick={() => { playSound("click"); setActiveTab("keywords"); }}
            className={`flex-1 py-2 font-bold text-center border-b-2 transition rounded-none cursor-pointer
              ${activeTab === "keywords" ? "text-orange-400 border-orange-500" : "text-zinc-400 border-transparent hover:text-zinc-200"}
            `}
          >
            🏷️ 情境關鍵字
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-sm leading-relaxed text-zinc-300">
          {activeTab === "intro" && (
            <div className="space-y-4 animate-scale-up">
              <p>
                歡迎來到<span className="text-zinc-100 font-bold">《勇氣の燈燈小隊戀愛相談室》</span>！
                這是一座隱密於城市角落的 <span className="text-orange-400 font-mono">R&D 工業風照明研發實驗室</span>。
              </p>
              <p>
                這裡的三位照明專家 Claire、Ethan、Leo 發現，愛情的本質與光學物理完全相通——同樣擁有色溫（熱情程度）、照度（關懷密度）與電阻（溝通障礙）。
              </p>
              <div className="bg-zinc-900/40 rounded-none p-4 border border-zinc-800 space-y-2">
                <span className="font-bold text-xs text-orange-400 font-mono">⚙️ 核心運作方式：</span>
                <ol className="list-decimal pl-4 text-xs space-y-2 text-zinc-400">
                  <li>在最下方的終端機輸入框中，輸入你的真實戀愛煩惱（字數不限）。</li>
                  <li>系統將自動抓取文中的 <span className="text-zinc-200 font-bold">情感訊號關鍵字</span> 並辨識出 11 種典型的戀愛電路故障（如已讀不回、吃醋、告白等）。</li>
                  <li>燈燈小隊的三位成員將針對此情境，<span className="text-zinc-200 font-bold">依序在對話框中發表他們的獨特看法</span>！</li>
                  <li>對話發表完畢後，他們還會展開有趣的 <span className="text-orange-400 font-bold">「內部吐槽」</span>！玩家可點擊對話框推進文本。</li>
                </ol>
              </div>
              <p className="text-xs text-zinc-500 font-mono">
                *本諮商完全處於本地端安全迴路（100% Client-Side），不呼叫任何外部 AI 或網路傳輸，請安心傾吐心聲。
              </p>
            </div>
          )}

          {activeTab === "members" && (
            <div className="space-y-4 animate-scale-up">
              {/* Claire */}
              <div className="flex gap-3 bg-rose-950/10 border border-rose-500/20 rounded-none p-3.5">
                <span className="text-3xl">💡</span>
                <div className="space-y-1">
                  <p className="font-bold text-rose-300 text-xs">Claire Lin - 溫柔治癒擔當</p>
                  <p className="text-xs text-zinc-400">「沒關係，我陪你。」</p>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    雙丸子頭、紅白外套女生。專長調配 2700K 暖光。會先接住玩家的情緒，提供最療癒的安慰與和緩建議。
                  </p>
                </div>
              </div>

              {/* Ethan */}
              <div className="flex gap-3 bg-sky-950/10 border border-sky-500/20 rounded-none p-3.5">
                <span className="text-3xl">📊</span>
                <div className="space-y-1">
                  <p className="font-bold text-sky-300 text-xs">Ethan Hsu - 理性數據分析</p>
                  <p className="text-xs text-zinc-400">「先別急，我們看事實。」</p>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    短髮、深藍外套男生。精通光譜儀。說話直接、充滿直男理科數據，但本質上是為了找出系統故障點（Bug）。
                  </p>
                </div>
              </div>

              {/* Leo */}
              <div className="flex gap-3 bg-amber-950/10 border border-amber-500/20 rounded-none p-3.5">
                <span className="text-3xl">⚡</span>
                <div className="space-y-1">
                  <p className="font-bold text-amber-300 text-xs">Leo Chang - 熱血行動派</p>
                  <p className="text-xs text-zinc-400">「交給我！」</p>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    長馬尾、黑色連帽衫男生。手持高流明探照燈。常提出好笑、荒謬的搞怪作戰，但最後總會給出超級溫暖熱血的擁抱和打氣。
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "keywords" && (
            <div className="space-y-3 animate-scale-up text-xs">
              <p className="text-zinc-400">
                本系統包含 11 個情境，每個情境均有超過 15 句對話。可輸入包含以下字眼的句子來直接觸發：
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">💬 已讀不回</span>: 已讀、沒回、不回、訊息、消失
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">💖 告白心意</span>: 告白、表白、喜歡他、喜歡她
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">💔 分手療傷</span>: 分手、失戀、離開
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">🤝 復合可能</span>: 復合、前任、想他、想她
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">❄️ 冷戰僵局</span>: 吵架、冷戰、生氣
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">🍋 妒意吃醋</span>: 吃醋、嫉妒、別人
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">🥺 沒安全感</span>: 沒安全感、不安、害怕、焦慮
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">💼 對方太忙</span>: 很忙、沒時間、工作、加班
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">❓ 喜不喜歡我</span>: 喜不喜歡、是不是喜歡、曖昧
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">🌹 曖昧期推進</span>: 聊天、約會、靠近
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-none border border-zinc-800">
                  <span className="font-bold text-orange-400">💍 單身自由</span>: 單身、一個人、不想談
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 text-center">若未符合任何字眼，將自動歸類至「其他戀愛煩惱」並給予極佳諮商。</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="mt-4 pt-3 border-t border-zinc-900 text-right">
          <button
            onClick={() => { playSound("click"); onClose(); }}
            className="px-6 py-2.5 rounded-none bg-white text-black hover:bg-orange-500 hover:text-white font-bold text-xs uppercase tracking-widest transition duration-150 cursor-pointer shadow-lg"
          >
            👍 了解，開始偵測電路！
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. SETTINGS (設定) MODAL
interface SettingsModalProps extends ModalProps {
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
  isMusicMuted: boolean;
  onMusicMuteToggle: (muted: boolean) => void;
  musicVolume: number;
  onMusicVolumeChange: (vol: number) => void;
  textSpeed: "slow" | "normal" | "instant";
  onSpeedChange: (speed: "slow" | "normal" | "instant") => void;
  onResetData: () => void;
  customClaire: Record<string, string | null>;
  customEthan: Record<string, string | null>;
  customLeo: Record<string, string | null>;
  onCustomImageChange: (id: string, emotion: string, url: string | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onMuteToggle,
  isMusicMuted,
  onMusicMuteToggle,
  musicVolume,
  onMusicVolumeChange,
  textSpeed,
  onSpeedChange,
  onResetData,
}) => {
  const [confirmReset, setConfirmReset] = React.useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-zinc-950 border border-zinc-800 rounded-none shadow-[0_0_50px_rgba(244,63,94,0.1)] flex flex-col p-6 text-zinc-100 max-h-[90vh]">
        
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-zinc-500 to-orange-500" />
        
        {/* Title */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-sans font-bold text-lg tracking-wider text-orange-400 flex items-center gap-2">
            ⚙️ 實驗室參數調整 <span className="text-[10px] font-mono text-zinc-500">SYSTEM_REGULATOR</span>
          </h3>
          <button
            onClick={() => { playSound("click"); onClose(); }}
            className="w-8 h-8 rounded-none border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white transition flex items-center justify-center text-zinc-400 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Settings */}
        <div className="space-y-4 py-2 overflow-y-auto pr-1 flex-1">
          
          {/* Sound toggle */}
          <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/80 p-3.5 rounded-none">
            <div className="space-y-0.5">
              <span className="font-sans font-bold text-xs text-zinc-200 block">🔊 遊戲動作音效 (SFX)</span>
              <span className="text-[10px] text-zinc-500 font-mono">RETRO CHIRP SOUND EFFECTS</span>
            </div>
            <button
              onClick={() => {
                const target = !isMuted;
                onMuteToggle(target);
                // Delay slightly to play sound if unmuting
                setTimeout(() => playSound("click"), 50);
              }}
              className={`px-4 py-2 rounded-none text-xs font-bold transition duration-300 active:scale-95 cursor-pointer
                ${!isMuted 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" 
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700"
                }
              `}
            >
              {!isMuted ? "已開啟 ON" : "已靜音 OFF"}
            </button>
          </div>

          {/* Background Music toggle */}
          <div className="space-y-2.5 bg-zinc-900/50 border border-zinc-800/80 p-3.5 rounded-none">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-sans font-bold text-xs text-zinc-200 block">🎵 背景音樂播放 (BGM)</span>
                <span className="text-[10px] text-zinc-500 font-mono">ATMOSPHERIC BACKGROUND MUSIC</span>
              </div>
              <button
                onClick={() => {
                  const target = !isMusicMuted;
                  onMusicMuteToggle(target);
                  // Delay slightly to play sound if unmuting
                  setTimeout(() => playSound("click"), 50);
                }}
                className={`px-4 py-2 rounded-none text-xs font-bold transition duration-300 active:scale-95 cursor-pointer
                  ${!isMusicMuted 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" 
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700"
                  }
                `}
              >
                {!isMusicMuted ? "已開啟 ON" : "已靜音 OFF"}
              </button>
            </div>

            {/* BGM Volume Slider inside Settings Modal */}
            {!isMusicMuted && (
              <div className="flex items-center gap-3 px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-none animate-fade-in mt-1">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider w-16">BGM 音量</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => onMusicVolumeChange(parseInt(e.target.value, 10))}
                  className="flex-1 h-1 bg-zinc-800 appearance-none cursor-pointer accent-emerald-500 rounded-none outline-none"
                />
                <span className="text-[10px] font-mono text-emerald-400 w-8 text-right font-bold">{musicVolume}%</span>
              </div>
            )}
          </div>



          {/* Reset progress */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 p-3.5 rounded-none space-y-3">
            <div className="space-y-0.5">
              <span className="font-sans font-bold text-xs text-zinc-400 block">⚠️ 重置任務進度與金幣資源</span>
              <span className="text-[10px] text-zinc-500 font-mono">RESET MISSIONS, COINS & UPGRADES</span>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => {
                  playSound("click");
                  setConfirmReset(true);
                }}
                className="w-full py-2.5 text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 rounded-none transition active:scale-95 cursor-pointer"
              >
                🔥 重置任務與金幣資源 (RESET)
              </button>
            ) : (
              <div className="flex gap-2 animate-fade-in">
                <button
                  onClick={() => {
                    playSound("success");
                    onResetData();
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-500 rounded-none transition active:scale-95 cursor-pointer"
                >
                  💣 確定重置 (CONFIRM)
                </button>
                <button
                  onClick={() => {
                    playSound("click");
                    setConfirmReset(false);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-none transition active:scale-95 cursor-pointer"
                >
                  取消
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer buttons */}
        <div className="mt-4 text-right shrink-0">
          <button
            onClick={() => { playSound("click"); onClose(); }}
            className="w-full py-3 rounded-none bg-white text-black hover:bg-orange-500 hover:text-white font-bold text-xs uppercase tracking-widest transition cursor-pointer"
          >
            完成並返回 (CONFIRM)
          </button>
        </div>
      </div>
    </div>
  );
};
