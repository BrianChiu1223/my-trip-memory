import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_STATE } from "../lib/demo-data.ts";
import {
  days,
  filterTrips,
  PLACES,
  stats,
  validateTrip,
  type Trip,
} from "../lib/travel.ts";

test("示例的国家、城市、天数和照片数量来自同一份旅行数据", () => {
  assert.deepEqual(stats(DEMO_STATE.trips), {
    countries: 4,
    cities: 9,
    trips: 6,
    days: 28,
    photos: 16,
  });
});
test("重复到访与日期重叠不会重复解锁国家、城市或旅行日", () => {
  const first = DEMO_STATE.trips[0];
  const second = {
    ...first,
    id: "repeat",
    startDate: "2026-05-04",
    endDate: "2026-05-08",
  };
  assert.deepEqual(stats([first, second]), {
    countries: 1,
    cities: 2,
    trips: 2,
    days: 8,
    photos: 6,
  });
  assert.equal(stats([second]).cities, 2);
  assert.equal(stats([]).cities, 0);
});
test("跨国行程的城市按 ID 去重，删除最后一条访问后撤销解锁", () => {
  const t: Trip = {
    ...DEMO_STATE.trips[0],
    places: [
      PLACES.find((p) => p.id === "jp-tokyo")!,
      PLACES.find((p) => p.id === "kr-seoul")!,
    ],
  };
  assert.equal(stats([t]).countries, 2);
  assert.equal(stats([t]).cities, 2);
  assert.equal(stats([t, ...DEMO_STATE.trips]).countries, 5);
  assert.equal(stats(DEMO_STATE.trips).countries, 4);
});
test("搜索能找到日记和城市，年份筛选包含跨年行程", () => {
  assert.equal(filterTrips(DEMO_STATE.trips, "章鱼烧")[0].id, "kyoto");
  assert.equal(filterTrips(DEMO_STATE.trips, "丽江")[0].id, "dali");
  assert.equal(filterTrips(DEMO_STATE.trips, "", "all", "CN").length, 3);
  assert.equal(filterTrips(DEMO_STATE.trips, "", "all", "all", true).length, 4);
  const cross = {
    ...DEMO_STATE.trips[0],
    startDate: "2025-12-30",
    endDate: "2026-01-03",
  };
  assert.equal(filterTrips([cross], "", "2026").length, 1);
});
test("日期按日历日计算，不受时区、闰年或年末影响", () => {
  assert.equal(days("2024-02-28", "2024-03-01"), 3);
  assert.equal(days("2025-12-31", "2026-01-01"), 2);
  assert.equal(days("2026-05-01", "2026-05-01"), 1);
});
test("拒绝无效日期、反向日期、过长行程和未选择城市", () => {
  const t = DEMO_STATE.trips[0];
  assert.equal(validateTrip(t), null);
  assert.ok(validateTrip({ ...t, startDate: "2026-02-30" }));
  assert.ok(validateTrip({ ...t, endDate: "2026-04-01" }));
  assert.ok(validateTrip({ ...t, endDate: "2030-01-01" }));
  assert.ok(validateTrip({ ...t, places: [] }));
  assert.ok(validateTrip({ ...t, title: "   " }));
});
