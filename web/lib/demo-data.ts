import type { TravelState, Trip, TravelPhoto } from "./travel.ts";
import { PLACES } from "./travel.ts";
const places = (...ids: string[]) =>
  ids.map((id) => PLACES.find((p) => p.id === id)!);
const photo = (
  id: string,
  src: string,
  caption: string,
  portrait = false,
): TravelPhoto => ({
  id,
  src: `/media/${src}.webp`,
  caption,
  width: portrait ? 900 : 1400,
  height: portrait ? 1200 : 960,
});
const make = (t: Omit<Trip, "createdAt">): Trip => ({
  ...t,
  createdAt: t.startDate + "T12:00:00Z",
});
export const DEMO_STATE: TravelState = {
  version: 1,
  trips: [
    make({
      id: "kyoto",
      title: "把日子，过成京都的慢镜头",
      subtitle: "A little slower, a little closer.",
      startDate: "2026-05-01",
      endDate: "2026-05-06",
      places: places("jp-kyoto", "jp-osaka"),
      description: "在鸭川边发呆，在小巷里迷路。和你一起，连无所事事都很美好。",
      journal:
        "终于把一直说的京都之行，变成了日历上的六天。\n\n清晨的二年坂还没有什么人，店铺门前的风铃响个不停。我们没有赶去下一个景点，只是坐在路边，把一杯抹茶喝到见底。\n\n傍晚沿着鸭川一直走，你说这里的时间好像慢了一些。我想，也可能是因为那天我们都没有看手机。\n\n最后一天去了大阪，吃到了念念不忘的章鱼烧。以后想再来一次，看看这里的秋天。",
      tags: ["城市漫步", "慢旅行", "初夏"],
      favorite: true,
      photos: [
        photo("kyoto-1", "kyoto", "黄昏时分，走进京都的小巷", true),
        photo("kyoto-2", "japan-green", "京都的黄昏，刚刚好"),
        photo("kyoto-3", "japan-temple", "灯火渐渐亮起的晚上"),
      ],
    }),
    make({
      id: "paris",
      title: "巴黎，日落之前的约会",
      subtitle: "Meet me where the light is.",
      startDate: "2025-10-01",
      endDate: "2025-10-05",
      places: places("fr-paris"),
      description: "买一束花，沿着塞纳河散步，把黄昏留给彼此。",
      journal:
        "比起打卡所有的景点，我们更喜欢在巴黎随便走走。\n\n早上的面包店总是排着队，刚出炉的可颂还带着热气。你买了两杯咖啡，我们找了一张公园的长椅，当作今天的第一站。\n\n傍晚终于看到了铁塔亮起的那一刻。我们没有许什么很大的愿望，只希望每一年都能有这样的几天，一起去没去过的地方。",
      tags: ["日落收藏家", "城市漫步"],
      favorite: true,
      photos: [
        photo("paris-1", "paris", "在巴黎，等一场日落", true),
        photo("paris-2", "paris-river", "塞纳河边的散步时间"),
        photo("paris-3", "paris-street", "喜欢没有目的地的下午"),
      ],
    }),
    make({
      id: "dali",
      title: "去有风的地方，和你",
      subtitle: "Somewhere the wind takes us.",
      startDate: "2025-09-13",
      endDate: "2025-09-17",
      places: places("cn-dali", "cn-lijiang"),
      description: "洱海的风、古城的晚霞，还有一段不用赶路的时光。",
      journal:
        "在大理最喜欢的一件事，是每天醒来都不用着急。\n\n骑着小电动车沿洱海走，遇到好看的风景就停下。你在路边挑了一顶帽子，结果大部分时间都被风吹得要用手扶着。\n\n去了喜洲，也去了丽江。在古城吃完晚饭，沿着石板路慢慢走回住处。旅行的意义，有时候就是拥有一个很长的晚上。",
      tags: ["山野之间", "说走就走"],
      favorite: false,
      photos: [
        photo("dali-1", "dali", "把风和湖泊，装进记忆里"),
        photo("dali-2", "dali-town", "古城里的一整个下午", true),
        photo("dali-3", "dali", "再看一眼洱海"),
      ],
    }),
    make({
      id: "italy",
      title: "一场意大利的夏日来信",
      subtitle: "Postcards from a summer together.",
      startDate: "2025-07-12",
      endDate: "2025-07-18",
      places: places("it-rome", "it-florence"),
      description: "罗马的石板路，佛罗伦萨的晚风，还有每天一支的冰淇淋。",
      journal:
        "太阳很热，冰淇淋融化得很快。\n\n罗马的每一个转角都像一张明信片。我们走了很多路，也在很多喷泉旁边坐下来休息。\n\n去佛罗伦萨的火车上，你靠着窗睡着了。窗外是一片一片的向日葵，车厢很安静。那一刻觉得，旅途本身就已经很好。",
      tags: ["夏日来信", "城市漫步"],
      favorite: false,
      photos: [
        photo("italy-1", "rome", "所有道路，通向和你一起的夏天"),
        photo("italy-2", "florence", "佛罗伦萨的黄昏", true),
        photo("italy-3", "rome", "在古老的街道里闲逛"),
      ],
    }),
    make({
      id: "hangzhou",
      title: "借一场西湖的秋天",
      subtitle: "A quiet weekend by the lake.",
      startDate: "2024-11-09",
      endDate: "2024-11-10",
      places: places("cn-hangzhou"),
      description: "周末逃离城市，在湖边捡起一片秋天。",
      journal:
        "周五晚上临时决定的旅行，周六早上就已经在西湖边。\n\n没有攻略，也没有计划。在湖边坐了很久，直到太阳一点点落到山后面。你说以后要常常这样，给生活放一个小小的假。\n\n返程的高铁上，我们一起选了今天最喜欢的照片。",
      tags: ["周末出逃", "秋日限定"],
      favorite: true,
      photos: [
        photo("hangzhou-1", "hangzhou", "在西湖边，把时间交给风"),
        photo("hangzhou-2", "hangzhou", "湖边的一点绿意"),
      ],
    }),
    make({
      id: "shanghai",
      title: "第一站，从一场散步开始",
      subtitle: "Every story starts somewhere.",
      startDate: "2024-04-04",
      endDate: "2024-04-06",
      places: places("cn-shanghai"),
      description: "梧桐树下的咖啡、外滩的夜景，是我们故事的第一页。",
      journal:
        "这是第一次一起出门旅行。\n\n你负责找好吃的，我负责带相机。结果走了一整天才发现，照片里最多的还是路边的猫和我们点的咖啡。\n\n那天在外滩说好，以后要一起去很多很多地方。就从这里开始吧。",
      tags: ["故事的开始", "城市漫步"],
      favorite: true,
      photos: [
        photo("shanghai-1", "shanghai", "故事，从上海开始", true),
        photo("shanghai-2", "shanghai", "一起等城市亮灯"),
      ],
    }),
  ],
  wishes: [
    { id: "iceland", destination: "冰岛", note: "一起去追一次极光" },
    { id: "swiss", destination: "瑞士", note: "坐一列开往雪山的火车" },
    { id: "newzealand", destination: "新西兰", note: "在南半球，慢慢看星星" },
  ],
};
