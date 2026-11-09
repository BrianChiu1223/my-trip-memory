import type { TravelState } from "./travel.ts";
const DATABASE = "our-little-atlas";
let connection: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const req = indexedDB.open(DATABASE, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("state");
        req.result.createObjectStore("photos");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        connection = null;
        reject(req.error);
      };
    });
  return connection;
}
export async function loadState(): Promise<TravelState | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const r = database
      .transaction("state", "readonly")
      .objectStore("state")
      .get("current");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function saveState(
  state: TravelState,
  photos: { id: string; blob: Blob }[] = [],
): Promise<void> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(["state", "photos"], "readwrite");
    tx.objectStore("state").put(state, "current");
    photos.forEach((p) => tx.objectStore("photos").put(p.blob, p.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("保存被中断"));
  });
}
export async function readPhoto(id: string): Promise<Blob | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const r = database
      .transaction("photos", "readonly")
      .objectStore("photos")
      .get(id);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function deleteTripPhotos(ids: string[]): Promise<void> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("photos", "readwrite");
    ids.forEach((id) => tx.objectStore("photos").delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function preparePhoto(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("本地演示支持 JPG、PNG 和 WebP；HEIC 请先转换后再上传");
  if (file.size > 20 * 1024 * 1024)
    throw new Error(`「${file.name}」超过 20 MB，请先压缩后重试`);
  const image = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const ratio = Math.min(1, 2000 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("当前浏览器无法处理照片");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("照片处理失败"))),
        "image/jpeg",
        0.86,
      ),
    );
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    image.close();
  }
}
