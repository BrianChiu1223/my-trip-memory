export type Place = {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
};
export type TravelPhoto = {
  id: string;
  src: string;
  caption: string;
  width: number;
  height: number;
};
export type Trip = {
  id: string;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  places: Place[];
  description: string;
  journal: string;
  tags: string[];
  photos: TravelPhoto[];
  favorite: boolean;
  createdAt: string;
};
export type Wish = { id: string; destination: string; note: string };
export type TravelState = { version: 1; trips: Trip[]; wishes: Wish[] };

export const COUNTRIES = [
  {
    code: "CN",
    numeric: "156",
    name: "中国",
    english: "China",
    coordinates: [104, 35],
  },
  {
    code: "JP",
    numeric: "392",
    name: "日本",
    english: "Japan",
    coordinates: [138, 37],
  },
  {
    code: "FR",
    numeric: "250",
    name: "法国",
    english: "France",
    coordinates: [2.3, 47],
  },
  {
    code: "IT",
    numeric: "380",
    name: "意大利",
    english: "Italy",
    coordinates: [12.5, 43],
  },
  {
    code: "IS",
    numeric: "352",
    name: "冰岛",
    english: "Iceland",
    coordinates: [-19, 65],
  },
  {
    code: "NO",
    numeric: "578",
    name: "挪威",
    english: "Norway",
    coordinates: [10, 63],
  },
  {
    code: "CH",
    numeric: "756",
    name: "瑞士",
    english: "Switzerland",
    coordinates: [8.2, 46.8],
  },
  {
    code: "NZ",
    numeric: "554",
    name: "新西兰",
    english: "New Zealand",
    coordinates: [173, -41],
  },
  {
    code: "TH",
    numeric: "764",
    name: "泰国",
    english: "Thailand",
    coordinates: [101, 15],
  },
  {
    code: "KR",
    numeric: "410",
    name: "韩国",
    english: "South Korea",
    coordinates: [128, 36],
  },
  {
    code: "SG",
    numeric: "702",
    name: "新加坡",
    english: "Singapore",
    coordinates: [103.8, 1.35],
  },
  {
    code: "GB",
    numeric: "826",
    name: "英国",
    english: "United Kingdom",
    coordinates: [-2, 54],
  },
  {
    code: "US",
    numeric: "840",
    name: "美国",
    english: "United States",
    coordinates: [-100, 39],
  },
  {
    code: "ES",
    numeric: "724",
    name: "西班牙",
    english: "Spain",
    coordinates: [-3, 40],
  },
  {
    code: "GR",
    numeric: "300",
    name: "希腊",
    english: "Greece",
    coordinates: [23, 39],
  },
] as const;
export const PLACES: Place[] = [
  {
    id: "cn-shanghai",
    name: "上海",
    country: "CN",
    coordinates: [121.4737, 31.2304],
  },
  {
    id: "cn-hangzhou",
    name: "杭州",
    country: "CN",
    coordinates: [120.1551, 30.2741],
  },
  {
    id: "cn-dali",
    name: "大理",
    country: "CN",
    coordinates: [100.2676, 25.6065],
  },
  {
    id: "cn-lijiang",
    name: "丽江",
    country: "CN",
    coordinates: [100.2278, 26.855],
  },
  {
    id: "cn-chengdu",
    name: "成都",
    country: "CN",
    coordinates: [104.0665, 30.5728],
  },
  {
    id: "cn-beijing",
    name: "北京",
    country: "CN",
    coordinates: [116.4074, 39.9042],
  },
  {
    id: "cn-xiamen",
    name: "厦门",
    country: "CN",
    coordinates: [118.0894, 24.4798],
  },
  {
    id: "jp-kyoto",
    name: "京都",
    country: "JP",
    coordinates: [135.7681, 35.0116],
  },
  {
    id: "jp-osaka",
    name: "大阪",
    country: "JP",
    coordinates: [135.5023, 34.6937],
  },
  {
    id: "jp-tokyo",
    name: "东京",
    country: "JP",
    coordinates: [139.6917, 35.6895],
  },
  {
    id: "jp-fuji",
    name: "富士河口湖",
    country: "JP",
    coordinates: [138.754, 35.497],
  },
  {
    id: "fr-paris",
    name: "巴黎",
    country: "FR",
    coordinates: [2.3522, 48.8566],
  },
  { id: "fr-nice", name: "尼斯", country: "FR", coordinates: [7.262, 43.7102] },
  {
    id: "it-rome",
    name: "罗马",
    country: "IT",
    coordinates: [12.4964, 41.9028],
  },
  {
    id: "it-florence",
    name: "佛罗伦萨",
    country: "IT",
    coordinates: [11.2558, 43.7696],
  },
  {
    id: "it-braies",
    name: "布莱埃斯",
    country: "IT",
    coordinates: [12.085, 46.697],
  },
  {
    id: "is-reykjavik",
    name: "雷克雅未克",
    country: "IS",
    coordinates: [-21.9426, 64.1466],
  },
  {
    id: "no-oslo",
    name: "奥斯陆",
    country: "NO",
    coordinates: [10.7522, 59.9139],
  },
  {
    id: "ch-lucerne",
    name: "琉森",
    country: "CH",
    coordinates: [8.3093, 47.0502],
  },
  {
    id: "nz-queenstown",
    name: "皇后镇",
    country: "NZ",
    coordinates: [168.6626, -45.0312],
  },
  {
    id: "th-chiangmai",
    name: "清迈",
    country: "TH",
    coordinates: [98.9853, 18.7883],
  },
  {
    id: "kr-seoul",
    name: "首尔",
    country: "KR",
    coordinates: [126.978, 37.5665],
  },
  {
    id: "sg-singapore",
    name: "新加坡",
    country: "SG",
    coordinates: [103.8198, 1.3521],
  },
  {
    id: "gb-london",
    name: "伦敦",
    country: "GB",
    coordinates: [-0.1276, 51.5072],
  },
  {
    id: "us-newyork",
    name: "纽约",
    country: "US",
    coordinates: [-74.006, 40.7128],
  },
  {
    id: "es-barcelona",
    name: "巴塞罗那",
    country: "ES",
    coordinates: [2.1734, 41.3851],
  },
  {
    id: "gr-santorini",
    name: "圣托里尼",
    country: "GR",
    coordinates: [25.4615, 36.3932],
  },
];
export const countryName = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.name ?? code;
export const flag = (code: string) =>
  code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
export const days = (start: string, end: string) =>
  Math.round(
    (Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) /
      86400000,
  ) + 1;
export function stats(trips: Trip[]) {
  const countries = new Set<string>();
  const cities = new Map<string, Place>();
  const calendarDays = new Set<number>();
  for (const t of trips) {
    for (const p of t.places) {
      countries.add(p.country);
      cities.set(p.id, p);
    }
    const start = Date.parse(t.startDate + "T00:00:00Z");
    const end = Date.parse(t.endDate + "T00:00:00Z");
    for (let d = start; d <= end; d += 86400000) calendarDays.add(d);
  }
  return {
    countries: countries.size,
    cities: cities.size,
    trips: trips.length,
    days: calendarDays.size,
    photos: trips.reduce((n, t) => n + t.photos.length, 0),
  };
}
export function filterTrips(
  trips: Trip[],
  query = "",
  year = "all",
  country = "all",
  favorites = false,
) {
  const q = query.trim().toLocaleLowerCase();
  return trips
    .filter(
      (t) =>
        (!q ||
          [
            t.title,
            t.subtitle,
            t.description,
            t.journal,
            ...t.tags,
            ...t.places.map((p) => p.name + countryName(p.country)),
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)) &&
        (year === "all" ||
          t.startDate.slice(0, 4) === year ||
          (t.startDate <= `${year}-12-31` && t.endDate >= `${year}-01-01`)) &&
        (country === "all" || t.places.some((p) => p.country === country)) &&
        (!favorites || t.favorite),
    )
    .sort(
      (a, b) =>
        b.startDate.localeCompare(a.startDate) ||
        b.createdAt.localeCompare(a.createdAt),
    );
}
export function validateTrip(
  t: Pick<Trip, "title" | "startDate" | "endDate" | "places">,
): string | null {
  if (!t.title.trim()) return "给这段旅行起个名字吧";
  const validDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s + "T00:00:00Z")) &&
    new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
  if (!validDate(t.startDate) || !validDate(t.endDate))
    return "请填写有效的出发和返程日期";
  if (t.endDate < t.startDate) return "返程日期不能早于出发日期";
  if (days(t.startDate, t.endDate) > 366) return "一次旅行请控制在 366 天以内";
  if (!t.places.length) return "至少选择一个留下足迹的城市";
  return null;
}
export const dateRange = (t: Trip) =>
  `${t.startDate.replaceAll("-", ".")} — ${t.endDate.slice(5).replace("-", ".")}`;
