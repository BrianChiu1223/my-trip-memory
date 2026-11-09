"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  Earth,
  Heart,
  Image as ImageIcon,
  MapPin,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { DEMO_STATE } from "../lib/demo-data";
import {
  countryName,
  filterTrips,
  flag,
  stats,
  type Trip,
  type TravelState,
} from "../lib/travel";
import { deleteTripPhotos, loadState, saveState } from "../lib/local-store";
import { exportBackup, importBackup } from "../lib/backup";
import { TravelMap } from "./components/travel-map";
import { Photo } from "./components/photo";
import { Modal } from "./components/modal";
import { TripForm } from "./components/trip-form";
import {
  Lightbox,
  TripDetails,
  type AlbumPhoto,
} from "./components/trip-details";
import { Empty, Gallery, Timeline, TripCard } from "./components/views";

type View = "map" | "journal" | "gallery" | "timeline";
const VIEWS: { id: View; label: string; icon: typeof Earth }[] = [
  { id: "map", label: "足迹地图", icon: Earth },
  { id: "journal", label: "旅行手记", icon: BookOpen },
  { id: "gallery", label: "时光相册", icon: ImageIcon },
  { id: "timeline", label: "时间线", icon: CalendarDays },
];
export default function Home() {
  const [state, setState] = useState<TravelState>(DEMO_STATE);
  const stateRef = useRef(state);
  const [loaded, setLoaded] = useState(false);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("map");
  const [country, setCountry] = useState<string | null>(null);
  const [year, setYear] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Trip | "new" | null>(null);
  const [toast, setToast] = useState("");
  const [about, setAbout] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [wishDestination, setWishDestination] = useState("");
  const [wishNote, setWishNote] = useState("");
  const [wishError, setWishError] = useState("");
  const [album, setAlbum] = useState<{
    photos: AlbumPhoto[];
    index: number;
  } | null>(null);
  const [restore, setRestore] = useState<File | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    loadState()
      .then((saved) => {
        if (
          active &&
          saved?.version === 1 &&
          Array.isArray(saved.trips) &&
          Array.isArray(saved.wishes)
        ) {
          setState(saved);
          stateRef.current = saved;
        }
      })
      .catch(() => {
        if (active)
          setToast(
            "浏览器存储暂不可用，回忆仍可浏览；请检查隐私模式或存储设置。",
          );
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);
  const commit = useCallback(
    async (
      updater: (previous: TravelState) => TravelState,
      photos: { id: string; blob: Blob }[] = [],
    ) => {
      if (lock.current) throw new Error("上一条回忆还在保存，请稍等");
      lock.current = true;
      setBusy(true);
      try {
        const previous = stateRef.current;
        const next = updater(previous);
        await saveState(next, photos);
        stateRef.current = next;
        setState(next);
        const retained = new Set(
          next.trips.flatMap((t) => t.photos.map((p) => p.src)),
        );
        const removed = previous.trips
          .flatMap((t) => t.photos)
          .filter((p) => p.src.startsWith("local:") && !retained.has(p.src))
          .map((p) => p.src.slice(6));
        if (removed.length)
          await deleteTripPhotos(removed).catch(() => undefined);
      } catch (e) {
        throw new Error(
          e instanceof DOMException && e.name === "QuotaExceededError"
            ? "本机存储空间不足，请先导出备份或减少照片后重试"
            : e instanceof Error
              ? e.message
              : "保存失败，请检查浏览器存储设置",
        );
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [],
  );
  const summary = useMemo(() => stats(state.trips), [state.trips]);
  const filtered = useMemo(
    () => filterTrips(state.trips, query, year, countryFilter, onlyFavorites),
    [state.trips, query, year, countryFilter, onlyFavorites],
  );
  const mapTrips = useMemo(
    () => filterTrips(state.trips, query, year, "all", onlyFavorites),
    [state.trips, query, year, onlyFavorites],
  );
  const selected = state.trips.find((t) => t.id === selectedId);
  const latest = filterTrips(state.trips)[0];
  const years = useMemo(
    () =>
      [
        ...new Set(
          state.trips.flatMap((t) => {
            const ys = [];
            for (
              let y = Number(t.startDate.slice(0, 4));
              y <= Number(t.endDate.slice(0, 4));
              y++
            )
              ys.push(String(y));
            return ys;
          }),
        ),
      ]
        .sort()
        .reverse(),
    [state.trips],
  );
  const countryCodes = [
    ...new Set(state.trips.flatMap((t) => t.places.map((p) => p.country))),
  ];
  const allPhotos = useMemo(
    () =>
      filtered.flatMap((t) => t.photos.map((photo) => ({ photo, trip: t }))),
    [filtered],
  );
  const openTrip = (t: Trip) => setSelectedId(t.id);
  const favorite = (t: Trip) => {
    void commit((s) => ({
      ...s,
      trips: s.trips.map((x) =>
        x.id === t.id ? { ...x, favorite: !x.favorite } : x,
      ),
    }))
      .then(() =>
        setToast(t.favorite ? "已取消珍藏" : "这一段回忆，格外珍贵。"),
      )
      .catch((e) => setToast(e.message));
  };
  const openPhoto = (id: string, trip?: Trip) => {
    const photos = trip
      ? trip.photos.map((photo) => ({ photo, trip }))
      : allPhotos;
    const index = photos.findIndex((x) => x.photo.id === id);
    if (index >= 0) setAlbum({ photos, index });
  };
  const clearFilters = () => {
    setQuery("");
    setYear("all");
    setCountryFilter("all");
    setOnlyFavorites(false);
  };
  const navigate = (v: View) => {
    setView(v);
    setCountryFilter("all");
    if (v !== "map") setCountry(null);
  };
  async function saveTrip(trip: Trip, photos: { id: string; blob: Blob }[]) {
    await commit(
      (s) => ({
        ...s,
        trips: s.trips.some((t) => t.id === trip.id)
          ? s.trips.map((t) => (t.id === trip.id ? trip : t))
          : [trip, ...s.trips],
      }),
      photos,
    );
    setToast(
      form === "new" ? "新的足迹，已经写进我们的故事。" : "回忆已更新。",
    );
  }
  async function addWish(e: FormEvent) {
    e.preventDefault();
    setWishError("");
    if (!wishDestination.trim()) return;
    try {
      await commit((s) => ({
        ...s,
        wishes: [
          ...s.wishes,
          {
            id: crypto.randomUUID(),
            destination: wishDestination.trim(),
            note: wishNote.trim(),
          },
        ],
      }));
      setWishOpen(false);
      setWishDestination("");
      setWishNote("");
      setToast("下一站的期待，已经收好了。");
    } catch (e) {
      setWishError((e as Error).message);
    }
  }
  async function backup() {
    setBackupBusy(true);
    try {
      await exportBackup(stateRef.current);
      setToast("备份已导出，包含旅行记录和你上传的照片。");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBackupBusy(false);
    }
  }
  async function restoreBackup() {
    if (!restore) return;
    setBackupBusy(true);
    try {
      const imported = await importBackup(restore);
      await commit(() => imported.state, imported.photos);
      setRestore(null);
      clearFilters();
      setCountry(null);
      setToast("回忆已完整恢复。");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBackupBusy(false);
    }
  }
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => {
              navigate("map");
              clearFilters();
              setCountry(null);
            }}
            aria-label="途屿，回到足迹地图"
          >
            <span className="brand-icon">
              <Compass size={25} strokeWidth={1.45} />
            </span>
            <span className="brand-type">
              途屿<span>OUR LITTLE ATLAS</span>
            </span>
          </button>
          <nav className="desktop-nav" aria-label="主导航">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={view === v.id ? "active" : ""}
                aria-current={view === v.id ? "page" : undefined}
                onClick={() => navigate(v.id)}
              >
                {v.label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className={`icon-button search-toggle ${searchOpen ? "active" : ""}`}
              aria-label="搜索旅行"
              onClick={() => setSearchOpen((s) => !s)}
            >
              <Search size={19} />
            </button>
            <span className="header-divider" />
            <div className="couple-avatars" aria-label="你和我">
              <span>你</span>
              <span>我</span>
              <Heart size={9} fill="currentColor" />
            </div>
            <button
              className="primary-button new-trip"
              onClick={() => setForm("new")}
              disabled={!loaded || busy}
            >
              <Plus size={16} />
              <span>记录旅行</span>
            </button>
          </div>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="移动端主导航">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={view === v.id ? "active" : ""}
            aria-current={view === v.id ? "page" : undefined}
            onClick={() => navigate(v.id)}
          >
            <v.icon size={18} />
            <span>{v.label}</span>
          </button>
        ))}
      </nav>
      <main className="page-shell">
        {searchOpen && (
          <div className="search-bar">
            <Search size={18} />
            <input
              ref={searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="寻找一座城市、一段回忆，或某个瞬间…"
              aria-label="搜索城市、旅行或日记"
            />
            <span>{filtered.length} 段回忆</span>
            <button
              className="icon-button"
              aria-label="关闭搜索并清空"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }}
            >
              <X size={17} />
            </button>
          </div>
        )}
        <section className="page-intro">
          <div className="intro-copy">
            <span className="eyebrow">
              <span className="tiny-star">✳</span> TWO SOULS. ONE LITTLE WORLD.
            </span>
            <h1>
              {view === "map" ? (
                <>
                  世界很大，<em>我们慢慢走。</em>
                </>
              ) : view === "journal" ? (
                <>
                  走过的路，<em>都算数。</em>
                </>
              ) : view === "gallery" ? (
                <>
                  让这一刻，<em>再久一点。</em>
                </>
              ) : (
                <>
                  时间向前，<em>回忆在这里。</em>
                </>
              )}
            </h1>
            <p>
              {view === "map"
                ? "把路过的风景，变成属于我们的故事。"
                : view === "journal"
                  ? "收藏每次出发，也收藏那些平凡又闪光的日子。"
                  : view === "gallery"
                    ? "有些风景，因为一起看过，才变得特别。"
                    : "从第一次出发，到下一次心动。"}
            </p>
          </div>
          <div className="travel-stats" aria-label="我们的旅行统计">
            {[
              { value: summary.countries, label: "个国家", icon: Earth },
              { value: summary.cities, label: "座城市", icon: MapPin },
              { value: summary.trips, label: "次旅行", icon: Compass },
              { value: summary.days, label: "天在路上", icon: Heart },
            ].map((s) => (
              <div key={s.label}>
                <span className="stat-number">
                  {String(s.value).padStart(2, "0")}
                  <s.icon size={15} strokeWidth={1.25} />
                </span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
        <div className="view-heading">
          <div className="view-title">
            <span className="section-index">
              {view === "map"
                ? "01"
                : view === "journal"
                  ? "02"
                  : view === "gallery"
                    ? "03"
                    : "04"}
            </span>
            <h2>
              {view === "map"
                ? "我们的旅行版图"
                : view === "journal"
                  ? "把故事，一页页翻开"
                  : view === "gallery"
                    ? "光影里的小确幸"
                    : "一起走过的日子"}
            </h2>
            <span className="view-caption">
              {view === "map"
                ? "THE PLACES WE CALL OURS"
                : view === "journal"
                  ? "STORIES WORTH KEEPING"
                  : view === "gallery"
                    ? "LITTLE MOMENTS, BIG FEELINGS"
                    : "A TIMELINE OF US"}
            </span>
          </div>
          <div className="filters">
            <label className="select-wrap">
              <CalendarDays size={14} />
              <select
                aria-label="按年份筛选"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="all">全部年份</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </select>
              <ChevronDown size={12} />
            </label>
            {view !== "map" && (
              <label className="select-wrap">
                <MapPin size={14} />
                <select
                  aria-label="按国家筛选"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                >
                  <option value="all">所有目的地</option>
                  {countryCodes.map((c) => (
                    <option key={c} value={c}>
                      {countryName(c)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} />
              </label>
            )}
            <button
              className={`icon-button filter-favorite ${onlyFavorites ? "active" : ""}`}
              aria-label={onlyFavorites ? "显示所有回忆" : "只看珍藏回忆"}
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites((v) => !v)}
            >
              <Heart size={16} fill={onlyFavorites ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        {(query ||
          year !== "all" ||
          countryFilter !== "all" ||
          onlyFavorites) && (
          <div className="filter-summary">
            <span>
              {query && `“${query}” · `}
              {year !== "all" && `${year} 年 · `}
              {countryFilter !== "all" && `${countryName(countryFilter)} · `}
              {onlyFavorites && "珍藏 · "}找到{" "}
              {view === "map" ? mapTrips.length : filtered.length} 段旅行
            </span>
            <button className="text-button" onClick={clearFilters}>
              清除筛选 <X size={12} />
            </button>
          </div>
        )}
        {view === "map" && (
          <>
            <div className="atlas-layout">
              <TravelMap
                trips={mapTrips}
                country={country}
                onCountry={setCountry}
                onOpenTrip={openTrip}
              />
              <aside className="atlas-sidebar">
                {country ? (
                  <div className="country-story">
                    <span className="eyebrow">A LITTLE CLOSER</span>
                    <h3>
                      {flag(country)} {countryName(country)}，我们来过。
                    </h3>
                    <p>每一个点，都是一段一起走过的路。</p>
                    <div className="city-list">
                      {[
                        ...new Map(
                          mapTrips
                            .flatMap((t) =>
                              t.places.filter((p) => p.country === country),
                            )
                            .map((p) => [p.id, p]),
                        ).values(),
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            const t = mapTrips.find((t) =>
                              t.places.some((x) => x.id === p.id),
                            );
                            if (t) openTrip(t);
                          }}
                        >
                          <span className="city-dot" />
                          <span>
                            {p.name}
                            <small>
                              {
                                mapTrips.filter((t) =>
                                  t.places.some((x) => x.id === p.id),
                                ).length
                              }{" "}
                              段回忆
                            </small>
                          </span>
                          <ArrowUpRight size={15} />
                        </button>
                      ))}
                    </div>
                    {!mapTrips.some((t) =>
                      t.places.some((p) => p.country === country),
                    ) && (
                      <p className="field-note">
                        当前筛选下，还没有这个国家的旅行。
                      </p>
                    )}
                    <button
                      className="text-button"
                      onClick={() => {
                        setView("journal");
                        setCountryFilter(country);
                        setCountry(null);
                      }}
                    >
                      翻开这里的手记 <ArrowRight size={15} />
                    </button>
                  </div>
                ) : latest ? (
                  <button
                    className="featured-memory"
                    onClick={() => openTrip(latest)}
                  >
                    <div className="featured-image">
                      <Photo
                        src={latest.photos[0]?.src ?? ""}
                        alt={latest.title}
                      />
                      <span className="feature-badge">
                        <span /> 最近的一段回忆
                      </span>
                      <span className="feature-location">
                        <MapPin size={12} />
                        {latest.places.map((p) => p.name).join(" · ")}
                      </span>
                    </div>
                    <div className="featured-copy">
                      <span className="eyebrow">OUR LATEST CHAPTER</span>
                      <h3>{latest.title}</h3>
                      <p>{latest.description}</p>
                      <span className="featured-footer">
                        {latest.startDate.replaceAll("-", ".")}
                        <span>
                          重温这段旅行 <ArrowUpRight size={14} />
                        </span>
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="country-story">
                    <Compass size={28} />
                    <h3>第一站，会是哪里？</h3>
                    <p>从一段小小的旅行开始，把世界点亮。</p>
                    <button
                      className="text-button"
                      onClick={() => setForm("new")}
                    >
                      记下第一段旅行 <Plus size={14} />
                    </button>
                  </div>
                )}
                <div className="wish-card">
                  <div className="wish-card-title">
                    <span>
                      <Sparkles size={15} />
                      下一站的心动
                    </span>
                    <button
                      className="icon-button"
                      aria-label="添加旅行心愿"
                      onClick={() => setWishOpen(true)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p>总有一些地方，想和你一起去。</p>
                  <div className="wish-chips">
                    {state.wishes.slice(0, 3).map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setWishOpen(true)}
                        title={w.note}
                      >
                        <MapPin size={11} />
                        {w.destination}
                        <ArrowUpRight size={11} />
                      </button>
                    ))}
                    {!state.wishes.length && (
                      <button onClick={() => setWishOpen(true)}>
                        写下第一个心愿 <Plus size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </aside>
            </div>
            <section className="recent-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">COLLECTING MOMENTS, TOGETHER</span>
                  <h2>
                    最近的旅行
                    <span className="handwritten">
                      a few of our favorite days
                    </span>
                  </h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("journal")}
                >
                  翻开全部手记 <ArrowRight size={16} />
                </button>
              </div>
              <div className="trip-grid">
                {filtered.slice(0, 3).map((t) => (
                  <TripCard
                    key={t.id}
                    trip={t}
                    onOpen={() => openTrip(t)}
                    onFavorite={() => favorite(t)}
                    busy={busy}
                  />
                ))}
              </div>
              {!filtered.length && <Empty onClear={clearFilters} />}
            </section>
          </>
        )}
        {view === "journal" && (
          <>
            <div className="journal-toolbar">
              <span>
                {filtered.length} 段旅行，{stats(filtered).photos} 个定格的瞬间
              </span>
              <span>
                按出发时间，从近到远 <ArrowDown size={12} />
              </span>
            </div>
            <div className="trip-grid journal-grid">
              {filtered.map((t) => (
                <TripCard
                  key={t.id}
                  trip={t}
                  onOpen={() => openTrip(t)}
                  onFavorite={() => favorite(t)}
                  busy={busy}
                />
              ))}
            </div>
            {!filtered.length && <Empty onClear={clearFilters} />}
          </>
        )}
        {view === "gallery" && (
          <Gallery
            photos={allPhotos}
            onPhoto={(id) => openPhoto(id)}
            onClear={clearFilters}
          />
        )}
        {view === "timeline" && (
          <Timeline trips={filtered} onTrip={openTrip} onClear={clearFilters} />
        )}
        <div className="closing-note">
          <span className="closing-line" />
          <Heart size={15} strokeWidth={1.1} />
          <p>目的地会变，身边的人一直是你。</p>
          <span className="closing-line" />
        </div>
        <footer className="site-footer">
          <span>
            途屿 · OUR LITTLE ATLAS <span className="footer-separator">/</span>{" "}
            Made for the two of us.
          </span>
          <div>
            <span className="demo-label">
              <span />
              示例旅行 · 本机保存
            </span>
            <button onClick={() => setAbout(true)} className="text-button">
              <Settings2 size={13} />
              备份与关于
            </button>
          </div>
        </footer>
      </main>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{toast}</span>
          <button aria-label="关闭提示" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {selected && form === null && (
        <TripDetails
          trip={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => setForm(selected)}
          onFavorite={() => favorite(selected)}
          busy={busy}
          onPhoto={(id) => openPhoto(id, selected)}
          onDelete={async () => {
            try {
              await commit((s) => ({
                ...s,
                trips: s.trips.filter((t) => t.id !== selected.id),
              }));
              setSelectedId(null);
              setToast("这段旅行已删除。");
            } catch (e) {
              setToast((e as Error).message);
            }
          }}
        />
      )}
      {form && (
        <TripForm
          trip={form === "new" ? undefined : form}
          onClose={() => setForm(null)}
          onSave={saveTrip}
        />
      )}
      {album && (
        <Lightbox
          photos={album.photos}
          index={album.index}
          onChange={(i) => setAlbum((a) => (a ? { ...a, index: i } : null))}
          onClose={() => setAlbum(null)}
        />
      )}
      {wishOpen && (
        <Modal
          label="下一站的心动"
          onClose={() => setWishOpen(false)}
          className="small-modal"
        >
          <span className="eyebrow">PLACES ON OUR WISHLIST</span>
          <h2>下一站，想和你去。</h2>
          <p className="modal-description">
            先把向往的地方写下来，总有一天一起抵达。
          </p>
          <div className="wish-list">
            {state.wishes.map((w) => (
              <div key={w.id}>
                <MapPin size={17} />
                <span>
                  {w.destination}
                  <small>{w.note || "和你一起就好"}</small>
                </span>
                <button
                  className="icon-button"
                  aria-label={`移除${w.destination}心愿`}
                  disabled={busy}
                  onClick={() =>
                    void commit((s) => ({
                      ...s,
                      wishes: s.wishes.filter((x) => x.id !== w.id),
                    })).catch((e) => setWishError(e.message))
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={addWish}>
            <label className="field-label">
              想去的地方
              <input
                value={wishDestination}
                onChange={(e) => setWishDestination(e.target.value)}
                placeholder="比如：冰岛"
                required
                maxLength={40}
              />
            </label>
            <label className="field-label">
              想一起做的事
              <input
                value={wishNote}
                onChange={(e) => setWishNote(e.target.value)}
                placeholder="一起追一次极光"
                maxLength={100}
              />
            </label>
            {wishError && (
              <p className="form-error" role="alert">
                {wishError}
              </p>
            )}
            <button className="primary-button full-width" disabled={busy}>
              收好这份期待 <Plus size={15} />
            </button>
          </form>
        </Modal>
      )}
      {about && (
        <Modal
          label="备份与关于"
          onClose={() => {
            if (!backupBusy) setAbout(false);
          }}
          className="small-modal"
        >
          <span className="eyebrow">OUR LITTLE ATLAS / LOCAL DEMO</span>
          <h2>好好收藏，不止在此刻。</h2>
          <p className="modal-description">
            这里的旅行和照片是演示内容，与你们的真实经历无关。新记录和上传的照片只保存在当前设备、当前浏览器中。
          </p>
          <div className="about-note">
            <ShieldCheck size={21} />
            <div>
              <strong>本地演示，还没有云端私密空间</strong>
              <p>
                清除网站数据或更换浏览器会丢失本地记录。请定期导出备份；目前不支持双人同步或登录。正式版将通过邀请登录和私有照片存储保护回忆。
              </p>
            </div>
          </div>
          <div className="backup-actions">
            <button
              className="secondary-button"
              onClick={() => void backup()}
              disabled={backupBusy || busy}
            >
              <ArrowDownToLine size={16} />
              {backupBusy ? "正在整理回忆…" : "导出完整备份"}
            </button>
            <button
              className="secondary-button"
              onClick={() => importInput.current?.click()}
              disabled={backupBusy || busy}
            >
              <Upload size={16} />
              从备份恢复
            </button>
            <input
              type="file"
              className="sr-only"
              accept="application/json,.json"
              ref={importInput}
              onChange={(e) => {
                if (e.target.files?.[0]) setRestore(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
          {restore && (
            <div className="restore-confirm">
              <strong>用「{restore.name}」恢复？</strong>
              <p>这会替换本机现有的旅行和心愿。建议先导出当前备份。</p>
              <div>
                <button
                  className="primary-button"
                  disabled={backupBusy || busy}
                  onClick={() => void restoreBackup()}
                >
                  确认恢复
                </button>
                <button
                  className="text-button"
                  disabled={backupBusy}
                  onClick={() => setRestore(null)}
                >
                  取消
                </button>
              </div>
            </div>
          )}
          <div className="about-credits">
            <p>示例照片：Unsplash · 地图数据：Natural Earth</p>
            <p>地图仅为旅行足迹示意，不用于导航。</p>
          </div>
        </Modal>
      )}
    </>
  );
}
