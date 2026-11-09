import { z } from "zod";
import { COUNTRIES, validateTrip, type TravelState } from "./travel.ts";
import { readPhoto } from "./local-store.ts";
const place = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  country: z.string().refine((c) => COUNTRIES.some((x) => x.code === c)),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-85).max(85),
  ]),
});
const photo = z.object({
  id: z.string().min(1).max(100),
  src: z.string().regex(/^(local:[a-zA-Z0-9-]+|\/media\/[a-z0-9-]+\.webp)$/),
  caption: z.string().max(500),
  width: z.number().positive().max(20000),
  height: z.number().positive().max(20000),
});
const trip = z
  .object({
    id: z.string().min(1).max(100),
    title: z.string().min(1).max(80),
    subtitle: z.string().max(200),
    startDate: z.string(),
    endDate: z.string(),
    places: z.array(place).min(1).max(100),
    description: z.string().max(300),
    journal: z.string().max(20000),
    tags: z.array(z.string().max(120)).max(6),
    photos: z.array(photo).max(20),
    favorite: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .refine((t) => validateTrip(t) === null, "旅行日期或地点无效");
const schema = z.object({
  format: z.literal("our-atlas-backup"),
  version: z.literal(1),
  state: z.object({
    version: z.literal(1),
    trips: z.array(trip).max(500),
    wishes: z
      .array(
        z.object({
          id: z.string().max(100),
          destination: z.string().min(1).max(40),
          note: z.string().max(100),
        }),
      )
      .max(100),
  }),
  photos: z
    .array(
      z.object({
        id: z.string().max(100),
        data: z
          .string()
          .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
      }),
    )
    .max(10000),
});
function asData(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
export async function exportBackup(state: TravelState): Promise<void> {
  const ids = [
    ...new Set(
      state.trips
        .flatMap((t) => t.photos)
        .filter((p) => p.src.startsWith("local:"))
        .map((p) => p.src.slice(6)),
    ),
  ];
  const photos = [];
  for (const id of ids) {
    const blob = await readPhoto(id);
    if (!blob) throw new Error("有本地照片缺失，请先检查相册后再导出");
    photos.push({ id, data: await asData(blob) });
  }
  const blob = new Blob(
    [
      JSON.stringify(
        {
          format: "our-atlas-backup",
          version: 1,
          exportedAt: new Date().toISOString(),
          state,
          photos,
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `我们的旅行备份-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importBackup(
  file: File,
): Promise<{ state: TravelState; photos: { id: string; blob: Blob }[] }> {
  if (file.size > 100 * 1024 * 1024)
    throw new Error("演示版支持导入 100 MB 以内的备份");
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new Error("备份不是有效的 JSON 文件");
  }
  const result = schema.safeParse(json);
  if (!result.success)
    throw new Error("备份格式或数据不完整，请选择本网站导出的备份文件");
  const data = result.data;
  const ids = new Set(data.photos.map((p) => p.id));
  const tripIds = data.state.trips.map((t) => t.id);
  const photoIds = data.state.trips.flatMap((t) => t.photos.map((p) => p.id));
  if (
    new Set(tripIds).size !== tripIds.length ||
    new Set(photoIds).size !== photoIds.length ||
    ids.size !== data.photos.length
  )
    throw new Error("备份中存在重复记录");
  for (const p of data.state.trips.flatMap((t) => t.photos))
    if (p.src.startsWith("local:") && !ids.has(p.src.slice(6)))
      throw new Error("备份缺少照片文件，无法完整恢复");
  const photos = data.photos.map((p) => {
    const [meta, base64] = p.data.split(",");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return {
      id: p.id,
      blob: new Blob([bytes], { type: meta.slice(5).split(";")[0] }),
    };
  });
  return { state: data.state, photos };
}
