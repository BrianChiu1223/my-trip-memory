import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadState,
  readPhoto,
  saveState,
  deleteTripPhotos,
} from "../lib/local-store.ts";
import { importBackup } from "../lib/backup.ts";
import { DEMO_STATE } from "../lib/demo-data.ts";

test("IndexedDB 一次事务保存旅行和照片，重新读取仍可恢复", async () => {
  const blob = new Blob(["test-image-bytes"], { type: "image/jpeg" });
  await saveState(DEMO_STATE, [{ id: "persistent-photo", blob }]);
  const state = await loadState();
  assert.deepEqual(state, DEMO_STATE);
  const photo = await readPhoto("persistent-photo");
  assert.equal(await photo?.text(), "test-image-bytes");
  await deleteTripPhotos(["persistent-photo"]);
  assert.equal(await readPhoto("persistent-photo"), undefined);
});
test("完整备份可以恢复本地照片字节，缺少照片时拒绝覆盖现有记录", async () => {
  const state = structuredClone(DEMO_STATE);
  state.trips[0].photos = [
    {
      id: "local-one",
      src: "local:local-one",
      caption: "本地测试照片",
      width: 2,
      height: 2,
    },
  ];
  const backup = {
    format: "our-atlas-backup",
    version: 1,
    state,
    photos: [{ id: "local-one", data: "data:image/jpeg;base64,dGVzdA==" }],
  };
  const valid = new File([JSON.stringify(backup)], "backup.json", {
    type: "application/json",
  });
  const imported = await importBackup(valid);
  assert.deepEqual(imported.state, state);
  assert.equal(await imported.photos[0].blob.text(), "test");
  const missing = new File(
    [JSON.stringify({ ...backup, photos: [] })],
    "missing.json",
  );
  await assert.rejects(importBackup(missing), /缺少照片/);
});
test("备份导入拒绝任意外链、重复 ID、异常日期和非备份 JSON", async () => {
  const make = (state: unknown) =>
    new File(
      [
        JSON.stringify({
          format: "our-atlas-backup",
          version: 1,
          state,
          photos: [],
        }),
      ],
      "backup.json",
    );
  const external = structuredClone(DEMO_STATE);
  external.trips[0].photos[0].src = "https://unknown.example/track.jpg";
  await assert.rejects(importBackup(make(external)), /格式或数据/);
  const duplicate = structuredClone(DEMO_STATE);
  duplicate.trips.push(duplicate.trips[0]);
  await assert.rejects(importBackup(make(duplicate)), /重复记录/);
  const invalid = structuredClone(DEMO_STATE);
  invalid.trips[0].endDate = "2026-04-01";
  await assert.rejects(importBackup(make(invalid)), /格式或数据/);
  await assert.rejects(
    importBackup(new File(["hello"], "not-json.json")),
    /有效的 JSON/,
  );
});
