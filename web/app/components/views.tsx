"use client";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Compass,
  Heart,
  MapPin,
} from "lucide-react";
import { dateRange, days, type Trip } from "../../lib/travel";
import { Photo } from "./photo";
import type { AlbumPhoto } from "./trip-details";
export function TripCard({
  trip,
  onOpen,
  onFavorite,
  busy,
}: {
  trip: Trip;
  onOpen: () => void;
  onFavorite: () => void;
  busy: boolean;
}) {
  return (
    <article className="trip-card">
      <button
        className="trip-card-image"
        onClick={onOpen}
        aria-label={`打开旅行：${trip.title}`}
      >
        <Photo
          src={trip.photos[0]?.src ?? ""}
          alt={trip.photos[0]?.caption ?? trip.title}
          loading="lazy"
        />
        <span className="trip-location">
          <MapPin size={12} />
          {trip.places.map((p) => p.name).join(" · ")}
        </span>
        <span className="trip-photo-count">
          <Camera size={12} />
          {trip.photos.length}
        </span>
        <span className="trip-view-arrow">
          <ArrowUpRight size={21} />
        </span>
      </button>
      <button
        className={`favorite-button ${trip.favorite ? "active" : ""}`}
        aria-label={`${trip.favorite ? "取消珍藏" : "珍藏"}：${trip.title}`}
        aria-pressed={trip.favorite}
        disabled={busy}
        onClick={onFavorite}
      >
        <Heart size={15} fill={trip.favorite ? "currentColor" : "none"} />
      </button>
      <button className="trip-card-copy" onClick={onOpen}>
        <span className="trip-date">
          {dateRange(trip)} <span>·</span> {days(trip.startDate, trip.endDate)}{" "}
          天
        </span>
        <h3>{trip.title}</h3>
        <p>{trip.description || "属于我们的下一页故事。"}</p>
        <span className="trip-card-tags">
          {trip.tags.slice(0, 2).map((t) => (
            <span key={t}># {t}</span>
          ))}
        </span>
      </button>
    </article>
  );
}
export function Gallery({
  photos,
  onPhoto,
  onClear,
}: {
  photos: AlbumPhoto[];
  onPhoto: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <>
      <div className="gallery-intro">
        <span>共有 {photos.length} 个想留住的瞬间</span>
        <span>
          <Camera size={14} /> 照片会记得，我们来过
        </span>
      </div>
      <div className="photo-wall">
        {photos.map(({ photo, trip }, i) => (
          <button
            className={`wall-photo ${i % 5 === 1 ? "portrait" : ""}`}
            key={photo.id}
            onClick={() => onPhoto(photo.id)}
            aria-label={`放大照片：${photo.caption}`}
          >
            <Photo src={photo.src} alt={photo.caption} loading="lazy" />
            <span className="wall-photo-overlay">
              <span>{photo.caption}</span>
              <small>
                <MapPin size={11} />
                {trip.places[0]?.name} · {trip.startDate.slice(0, 4)}
              </small>
              <ArrowUpRight size={17} />
            </span>
          </button>
        ))}
      </div>
      {!photos.length && (
        <Empty
          onClear={onClear}
          text="这里，还没有照片。为旅行添几张新的回忆吧。"
        />
      )}
    </>
  );
}
export function Timeline({
  trips,
  onTrip,
  onClear,
}: {
  trips: Trip[];
  onTrip: (t: Trip) => void;
  onClear: () => void;
}) {
  const years = [...new Set(trips.map((t) => t.startDate.slice(0, 4)))]
    .sort()
    .reverse();
  return (
    <div className="timeline">
      {years.map((y) => (
        <section key={y} className="timeline-year">
          <div className="timeline-year-label">
            <span>{y}</span>
            <small>
              {trips.filter((t) => t.startDate.startsWith(y)).length} 次出发
            </small>
          </div>
          <div className="timeline-entries">
            {trips
              .filter((t) => t.startDate.startsWith(y))
              .map((t) => (
                <article className="timeline-entry" key={t.id}>
                  <span className="timeline-dot" />
                  <div className="timeline-date">
                    <span>{t.startDate.slice(5).replace("-", " / ")}</span>
                    <small>{days(t.startDate, t.endDate)} DAYS TOGETHER</small>
                  </div>
                  <button className="timeline-card" onClick={() => onTrip(t)}>
                    <Photo
                      src={t.photos[0]?.src ?? ""}
                      alt={t.title}
                      loading="lazy"
                    />
                    <div>
                      <span className="eyebrow">
                        {t.places.map((p) => p.name).join(" / ")}
                      </span>
                      <h3>{t.title}</h3>
                      <p>{t.description}</p>
                      <span className="text-button">
                        回到那一天 <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </button>
                </article>
              ))}
          </div>
        </section>
      ))}
      {!trips.length && <Empty onClear={onClear} />}
      <div className="timeline-start">
        <Heart size={16} />
        <span>每个故事，都从「我们」开始。</span>
      </div>
    </div>
  );
}
export function Empty({
  onClear,
  text = "还没找到这段回忆，换一个关键词试试。",
}: {
  onClear: () => void;
  text?: string;
}) {
  return (
    <div className="empty-state">
      <Compass size={35} strokeWidth={1.1} />
      <h3>故事还在路上。</h3>
      <p>{text}</p>
      <button className="secondary-button" onClick={onClear}>
        查看全部回忆 <ArrowRight size={14} />
      </button>
    </div>
  );
}
