"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { Modal } from "./modal";
import { Photo } from "./photo";
import {
  COUNTRIES,
  PLACES,
  countryName,
  flag,
  validateTrip,
  type Trip,
  type Place,
  type TravelPhoto,
} from "../../lib/travel";
import { preparePhoto } from "../../lib/local-store";

export function TripForm({
  trip,
  onClose,
  onSave,
}: {
  trip?: Trip;
  onClose: () => void;
  onSave: (trip: Trip, photos: { id: string; blob: Blob }[]) => Promise<void>;
}) {
  const [title, setTitle] = useState(trip?.title ?? "");
  const [start, setStart] = useState(trip?.startDate ?? "");
  const [end, setEnd] = useState(trip?.endDate ?? "");
  const [description, setDescription] = useState(trip?.description ?? "");
  const [journal, setJournal] = useState(trip?.journal ?? "");
  const [tags, setTags] = useState(trip?.tags.join("，") ?? "");
  const [selected, setSelected] = useState<Place[]>(trip?.places ?? []);
  const [country, setCountry] = useState(trip?.places[0]?.country ?? "CN");
  const [existing, setExisting] = useState<TravelPhoto[]>(trip?.photos ?? []);
  const [files, setFiles] = useState<
    { id: string; file: File; preview: string }[]
  >([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [saving, setSaving] = useState(false);
  const previews = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => previews.current.forEach(URL.revokeObjectURL), []);
  const toggle = (p: Place) =>
    setSelected((s) =>
      s.some((x) => x.id === p.id) ? s.filter((x) => x.id !== p.id) : [...s, p],
    );
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const err = validateTrip({
      title,
      startDate: start,
      endDate: end,
      places: selected,
    });
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    try {
      const processed: { id: string; blob: Blob }[] = [];
      const uploaded: TravelPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`正在整理照片 ${i + 1} / ${files.length}`);
        const f = files[i];
        const p = await preparePhoto(f.file);
        processed.push({ id: f.id, blob: p.blob });
        uploaded.push({
          id: f.id,
          src: `local:${f.id}`,
          caption: f.file.name.replace(/\.[^.]+$/, ""),
          width: p.width,
          height: p.height,
        });
      }
      setProgress("正在保存回忆…");
      await onSave(
        {
          id: trip?.id ?? crypto.randomUUID(),
          title: title.trim(),
          subtitle: trip?.subtitle ?? "Another little story of us.",
          startDate: start,
          endDate: end,
          places: selected,
          description: description.trim(),
          journal: journal.trim(),
          tags: tags
            .split(/[,，]/)
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 6),
          photos: [...existing, ...uploaded],
          favorite: trip?.favorite ?? false,
          createdAt: trip?.createdAt ?? new Date().toISOString(),
        },
        processed,
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败，请稍后重试");
    } finally {
      setSaving(false);
      setProgress("");
    }
  }
  return (
    <Modal
      label={trip ? "编辑旅行" : "记录新的旅行"}
      onClose={() => {
        if (!saving) onClose();
      }}
      className="form-modal"
    >
      <form onSubmit={submit}>
        <div className="form-heading">
          <span className="eyebrow">
            {trip ? "REVISIT A MEMORY" : "A NEW CHAPTER"}
          </span>
          <h2>
            {trip ? "让回忆，更完整一点。" : "把这一站，写进我们的故事。"}
          </h2>
          <p>记下风景，也记下当时的我们。</p>
        </div>
        <label className="field-label">
          旅行的名字 <span>*</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="比如：去有风的地方，和你"
            required
            autoFocus
          />
        </label>
        <div className="form-row">
          <label className="field-label">
            出发日期 <span>*</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            返程日期 <span>*</span>
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="field-label">
          这次去过哪里 <span>*</span>
          <div className="place-picker">
            <label className="sr-only" htmlFor="trip-country">
              选择国家
            </label>
            <select
              id="trip-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {flag(c.code)} {c.name}
                </option>
              ))}
            </select>
            <div className="place-options">
              {PLACES.filter((p) => p.country === country).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={
                    selected.some((x) => x.id === p.id) ? "selected" : ""
                  }
                  onClick={() => toggle(p)}
                >
                  {selected.some((x) => x.id === p.id) ? (
                    <Check size={13} />
                  ) : (
                    <Plus size={13} />
                  )}{" "}
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <p className="field-note">
            可以选择多个城市和国家；演示版先提供精选地点。
          </p>
          {selected.length > 0 && (
            <div className="selected-places">
              {selected.map((p) => (
                <button type="button" key={p.id} onClick={() => toggle(p)}>
                  <MapPin size={12} />
                  {countryName(p.country)} · {p.name}
                  <X size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="field-label">
          一句话，记住这次旅行
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="天气、心情，或者最想记住的一个瞬间…"
          />
        </label>
        <label className="field-label">
          我们的旅行手记
          <textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            maxLength={20000}
            rows={5}
            placeholder="今天发生了什么？有什么想对未来的我们说？"
          />
        </label>
        <label className="field-label">
          给回忆加个标签
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={120}
            placeholder="城市漫步，日落收藏家（用逗号分隔）"
          />
        </label>
        <div className="field-label">
          照片里的我们 <small>第一张照片会成为旅行封面</small>
          <div className="upload-grid">
            {existing.map((p) => (
              <div className="upload-thumb" key={p.id}>
                <Photo src={p.src} alt={p.caption} />
                <button
                  type="button"
                  aria-label={`移除${p.caption}`}
                  onClick={() =>
                    setExisting((x) => x.filter((v) => v.id !== p.id))
                  }
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {files.map((f) => (
              <div className="upload-thumb" key={f.id}>
                <img src={f.preview} alt={f.file.name} />
                <button
                  type="button"
                  aria-label={`移除${f.file.name}`}
                  onClick={() =>
                    setFiles((x) => x.filter((v) => v.id !== f.id))
                  }
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {existing.length + files.length < 20 && (
              <button
                type="button"
                className="upload-add"
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus size={24} />
                <span>添加照片</span>
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            aria-label="选择旅行照片"
            onChange={(e) => {
              const fs = [...(e.target.files ?? [])];
              if (fs.length + files.length + existing.length > 20) {
                setError("每次旅行最多添加 20 张照片");
                return;
              }
              setError("");
              setFiles((current) => [
                ...current,
                ...fs.map((file) => {
                  const preview = URL.createObjectURL(file);
                  previews.current.push(preview);
                  return { id: crypto.randomUUID(), file, preview };
                }),
              ]);
              e.target.value = "";
            }}
          />
          <p className="field-note">
            JPG / PNG / WebP，每张最多 20
            MB。演示版会保存适合浏览的压缩照片，原图请自行保留。
          </p>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-footer">
          <span>
            <span className="local-indicator" />
            仅保存在当前浏览器
          </span>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle className="spin" size={16} />
                {progress}
              </>
            ) : (
              <>
                {trip ? "保存修改" : "珍藏这段旅行"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
