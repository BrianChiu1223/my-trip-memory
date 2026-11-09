"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Heart,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { Modal } from "./modal";
import { Photo } from "./photo";
import {
  countryName,
  dateRange,
  days,
  type TravelPhoto,
  type Trip,
} from "../../lib/travel";
export type AlbumPhoto = { photo: TravelPhoto; trip: Trip };
export function TripDetails({
  trip,
  onClose,
  onEdit,
  onFavorite,
  onDelete,
  onPhoto,
  busy,
}: {
  trip: Trip;
  onClose: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  onDelete: () => Promise<void>;
  onPhoto: (id: string) => void;
  busy: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal label={trip.title} onClose={onClose} className="detail-modal">
      <div className="detail-cover">
        <Photo
          src={trip.photos[0]?.src ?? ""}
          alt={trip.photos[0]?.caption ?? trip.title}
        />
        <span className="detail-cover-gradient" />
        <span className="eyebrow">A CHAPTER OF US</span>
        <h2>{trip.title}</h2>
        <p>{trip.subtitle}</p>
      </div>
      <div className="detail-body">
        <div className="detail-meta">
          <span>
            <CalendarDays size={15} />
            {dateRange(trip)}
          </span>
          <span>
            <MapPin size={15} />
            {trip.places.map((p) => p.name).join(" · ")}
          </span>
          <span>{days(trip.startDate, trip.endDate)} 天的我们</span>
        </div>
        <div className="detail-actions">
          <button
            className={`secondary-button ${trip.favorite ? "is-favorite" : ""}`}
            onClick={onFavorite}
            disabled={busy}
          >
            <Heart size={15} fill={trip.favorite ? "currentColor" : "none"} />
            {trip.favorite ? "已珍藏" : "珍藏这段回忆"}
          </button>
          <button className="text-button" onClick={onEdit}>
            <Pencil size={14} />
            编辑旅行
          </button>
        </div>
        {trip.description && <p className="detail-intro">{trip.description}</p>}
        <div className="journal-text">
          {trip.journal ? (
            trip.journal
              .split("\n\n")
              .map((paragraph, i) => <p key={i}>{paragraph}</p>)
          ) : (
            <p className="muted-text">日记的这一页，等我们慢慢写。</p>
          )}
        </div>
        <div className="detail-tags">
          {trip.tags.map((t) => (
            <span key={t}># {t}</span>
          ))}
        </div>
        <div className="section-small-heading">
          <h3>
            定格的瞬间 <span>{trip.photos.length}</span>
          </h3>
          <Camera size={18} />
        </div>
        <div className="detail-photos">
          {trip.photos.map((p) => (
            <button
              key={p.id}
              onClick={() => onPhoto(p.id)}
              aria-label={`放大照片：${p.caption}`}
            >
              <Photo src={p.src} alt={p.caption} loading="lazy" />
              <span>{p.caption}</span>
            </button>
          ))}
        </div>
        {!trip.photos.length && (
          <div className="empty-mini">
            <Camera size={25} />
            <p>为这次旅行，添几张照片吧。</p>
            <button className="text-button" onClick={onEdit}>
              添加照片 <ArrowRight size={14} />
            </button>
          </div>
        )}
        <div className="detail-route">
          <MapPin size={15} />
          {trip.places.map((p, i) => (
            <span key={p.id}>
              {i > 0 && <span className="route-arrow">→</span>}
              {countryName(p.country)} · {p.name}
            </span>
          ))}
        </div>
        <div className="detail-bottom">
          <span>这一站的风景，已经好好收着了。</span>
          {confirm ? (
            <div className="delete-confirm">
              <span>删除旅行和本地照片？</span>
              <button disabled={busy} onClick={() => void onDelete()}>
                确定删除
              </button>
              <button onClick={() => setConfirm(false)}>取消</button>
            </div>
          ) : (
            <button
              className="text-button danger-text"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={13} />
              删除记录
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
export function Lightbox({
  photos,
  index,
  onChange,
  onClose,
}: {
  photos: AlbumPhoto[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const item = photos[index];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onChange((index + 1) % photos.length);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onChange((index - 1 + photos.length) % photos.length);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [index, photos.length, onChange]);
  if (!item) return null;
  return (
    <Modal
      label={`照片：${item.photo.caption}`}
      onClose={onClose}
      className="lightbox-modal"
    >
      <div className="lightbox-top">
        <span>{item.trip.title}</span>
        <span>
          {index + 1} / {photos.length}
        </span>
      </div>
      <div className="lightbox-picture">
        <Photo src={item.photo.src} alt={item.photo.caption} />
        {photos.length > 1 && (
          <>
            <button
              className="lightbox-prev"
              aria-label="上一张照片"
              onClick={() =>
                onChange((index - 1 + photos.length) % photos.length)
              }
            >
              <ArrowLeft size={22} />
            </button>
            <button
              className="lightbox-next"
              aria-label="下一张照片"
              onClick={() => onChange((index + 1) % photos.length)}
            >
              <ArrowRight size={22} />
            </button>
          </>
        )}
      </div>
      <div className="lightbox-caption">
        <h3>{item.photo.caption}</h3>
        <span>
          <MapPin size={13} />
          {item.trip.places.map((p) => p.name).join(" · ")}
          <span> / </span>
          {item.trip.startDate.replaceAll("-", ".")}
        </span>
      </div>
    </Modal>
  );
}
