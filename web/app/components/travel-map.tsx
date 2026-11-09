"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  geoArea,
  geoEqualEarth,
  geoMercator,
  geoPath,
  geoGraticule10,
} from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import {
  ArrowLeft,
  ArrowUpRight,
  Globe2,
  LocateFixed,
  Minus,
  Plus,
  Compass,
} from "lucide-react";
import { COUNTRIES, countryName, flag, type Trip } from "../../lib/travel";

const WIDTH = 1100,
  HEIGHT = 520;
type CountryFeature = Feature<Geometry, { name: string }>;
const labelOffsets: Record<string, [number, number]> = {
  CN: [0, 5],
  JP: [38, -15],
  FR: [-52, -22],
  IT: [30, 8],
};
function mainland(f: CountryFeature): CountryFeature {
  if (f.geometry.type !== "MultiPolygon") return f;
  const polygon = [...f.geometry.coordinates].sort(
    (a, b) =>
      geoArea({ type: "Polygon", coordinates: b }) -
      geoArea({ type: "Polygon", coordinates: a }),
  )[0];
  return { ...f, geometry: { type: "Polygon", coordinates: polygon } };
}
export function TravelMap({
  trips,
  country,
  onCountry,
  onOpenTrip,
}: {
  trips: Trip[];
  country: string | null;
  onCountry: (code: string | null) => void;
  onOpenTrip: (t: Trip) => void;
}) {
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    let active = true;
    setError(false);
    fetch("/data/world.json")
      .then((r) => {
        if (!r.ok) throw new Error("map");
        return r.json();
      })
      .then((raw) => {
        const t = raw as Topology<{ countries: GeometryCollection }>;
        if (active)
          setFeatures(
            (
              feature(t, t.objects.countries) as FeatureCollection<
                Geometry,
                { name: string }
              >
            ).features,
          );
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [country]);
  const visited = useMemo(
    () => new Set(trips.flatMap((t) => t.places.map((p) => p.country))),
    [trips],
  );
  const visitedPlaces = useMemo(
    () => [
      ...new Map(
        trips
          .flatMap((t) => t.places)
          .filter((p) => !country || p.country === country)
          .map((p) => [p.id, p]),
      ).values(),
    ],
    [trips, country],
  );
  const selectedFeature = features.find(
    (f) =>
      String(f.id).padStart(3, "0") ===
      COUNTRIES.find((c) => c.code === country)?.numeric,
  );
  const projection = useMemo(
    () =>
      country && selectedFeature
        ? geoMercator().fitExtent(
            [
              [150, 55],
              [950, 450],
            ],
            mainland(selectedFeature),
          )
        : geoEqualEarth().rotate([-10, 0]).scale(190).translate([535, 292]),
    [country, selectedFeature],
  );
  const path = geoPath(projection);
  const point = (coordinates: readonly number[]) =>
    projection([coordinates[0], coordinates[1]]) ?? [0, 0];
  const selectCountry = (f: CountryFeature) => {
    if (suppressClick.current) return;
    const c = COUNTRIES.find(
      (c) => c.numeric === String(f.id).padStart(3, "0"),
    );
    if (c && visited.has(c.code)) onCountry(c.code);
  };
  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const changeZoom = (by: number) => {
    setZoom((z) => Math.min(3, Math.max(1, z + by)));
    if (zoom + by <= 1) setPan({ x: 0, y: 0 });
  };
  return (
    <section
      className={`map-card ${country ? "is-country" : ""}`}
      aria-label={
        country ? `${countryName(country)}城市足迹地图` : "世界旅行足迹地图"
      }
    >
      <div className="map-card-top">
        <div className="map-crumb">
          {country ? (
            <button className="text-button" onClick={() => onCountry(null)}>
              <ArrowLeft size={15} /> 世界足迹
            </button>
          ) : (
            <>
              <Globe2 size={16} />
              <span>世界足迹</span>
            </>
          )}
          {country && (
            <>
              <span className="crumb-slash">/</span>
              <strong>
                {flag(country)} {countryName(country)}
              </strong>
            </>
          )}
        </div>
        <span className="map-count">
          <i />
          {country
            ? `${visitedPlaces.length} 座城市，留下我们的故事`
            : `${visited.size} 个国家，正在被点亮`}
        </span>
      </div>
      <div className="map-viewport">
        {error ? (
          <div className="map-loading">
            <Globe2 size={32} />
            <p>地图暂时没有加载成功</p>
            <button
              className="secondary-button"
              onClick={() => setRevision((r) => r + 1)}
            >
              重新加载
            </button>
          </div>
        ) : !features.length ? (
          <div className="map-loading">
            <Globe2 className="spin-slow" size={32} />
            <p>正在展开我们的世界…</p>
          </div>
        ) : (
          <svg
            ref={svg}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={
              country
                ? `${countryName(country)}地图，已到访${visitedPlaces.map((p) => p.name).join("、")}`
                : `世界地图，已到访${[...visited].map(countryName).join("、")}`
            }
            className={`world-svg ${zoom > 1 ? "can-drag" : ""}`}
            onPointerDown={(e) => {
              if (e.button !== 0 || zoom <= 1) return;
              suppressClick.current = false;
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                px: pan.x,
                py: pan.y,
                moved: false,
              };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || !svg.current) return;
              const dx = e.clientX - d.x,
                dy = e.clientY - d.y;
              if (Math.abs(dx) + Math.abs(dy) > 5) {
                d.moved = true;
                suppressClick.current = true;
                svg.current.setPointerCapture(e.pointerId);
              }
              if (d.moved) {
                const scale = WIDTH / svg.current.getBoundingClientRect().width;
                const maxX = (WIDTH * (zoom - 1)) / 2,
                  maxY = (HEIGHT * (zoom - 1)) / 2;
                setPan({
                  x: Math.max(-maxX, Math.min(maxX, d.px + dx * scale)),
                  y: Math.max(-maxY, Math.min(maxY, d.py + dy * scale)),
                });
              }
            }}
            onPointerUp={(e) => {
              drag.current = null;
              if (svg.current?.hasPointerCapture(e.pointerId))
                svg.current.releasePointerCapture(e.pointerId);
              setTimeout(() => {
                suppressClick.current = false;
              }, 0);
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <defs>
              <pattern
                id="map-dots"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="0.65" fill="#bec2ac" opacity=".27" />
              </pattern>
            </defs>
            <rect width={WIDTH} height={HEIGHT} fill="url(#map-dots)" />
            <g
              transform={`translate(${WIDTH / 2 + pan.x} ${HEIGHT / 2 + pan.y}) scale(${zoom}) translate(${-WIDTH / 2} ${-HEIGHT / 2})`}
            >
              {!country && (
                <path
                  d={path(geoGraticule10()) ?? ""}
                  className="map-graticule"
                />
              )}
              {features
                .filter((f) => f.id !== "010" && f.id !== 10)
                .map((f) => {
                  const c = COUNTRIES.find(
                    (c) => c.numeric === String(f.id).padStart(3, "0"),
                  );
                  const active = c && visited.has(c.code);
                  const selected = c?.code === country;
                  return (
                    <path
                      key={`${f.id}-${f.properties.name}`}
                      d={path(f) ?? ""}
                      className={`country-shape ${active ? "visited" : ""} ${country && !selected ? "muted" : ""} ${selected ? "selected" : ""}`}
                      tabIndex={active && !country ? 0 : undefined}
                      role={active && !country ? "button" : undefined}
                      aria-label={active ? `查看${c?.name}城市足迹` : undefined}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectCountry(f);
                        }
                      }}
                      onClick={() => selectCountry(f)}
                      onMouseEnter={() =>
                        setHover(c?.name ?? f.properties.name)
                      }
                      onMouseLeave={() => setHover("")}
                    >
                      <title>
                        {c?.name ?? f.properties.name}
                        {active ? " · 已到访" : ""}
                      </title>
                    </path>
                  );
                })}
              {!country && (
                <>
                  <text x="185" y="205" className="ocean-label">
                    NORTH AMERICA
                  </text>
                  <text x="310" y="395" className="ocean-label">
                    SOUTH AMERICA
                  </text>
                  <text x="540" y="202" className="ocean-label">
                    EUROPE
                  </text>
                  <text x="555" y="320" className="ocean-label">
                    AFRICA
                  </text>
                  <text x="808" y="194" className="ocean-label">
                    ASIA
                  </text>
                  <text x="932" y="405" className="ocean-label">
                    OCEANIA
                  </text>
                </>
              )}
              {!country &&
                [...visited].map((code) => {
                  const c = COUNTRIES.find((c) => c.code === code);
                  if (!c) return null;
                  const [x, y] = point(c.coordinates);
                  const [dx, dy] = labelOffsets[code] ?? [0, -12];
                  return (
                    <g
                      key={code}
                      className="map-label-group"
                      role="button"
                      tabIndex={0}
                      aria-label={`查看${c.name}城市足迹`}
                      onClick={() => {
                        if (!suppressClick.current) onCountry(code);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onCountry(code);
                        }
                      }}
                    >
                      <circle cx={x} cy={y} r="11" className="pin-halo" />
                      <circle cx={x} cy={y} r="4.5" className="map-dot" />
                      <g transform={`translate(${x + dx},${y + dy - 22})`}>
                        <rect
                          x="-36"
                          y="-15"
                          width="72"
                          height="29"
                          rx="7"
                          className="country-label-bg"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="country-label"
                        >
                          {c.name}
                          <tspan dx="6" className="label-dot">
                            ↗
                          </tspan>
                        </text>
                      </g>
                    </g>
                  );
                })}
              {country &&
                visitedPlaces.map((p, i) => {
                  const [x, y] = point(p.coordinates);
                  const crowded = visitedPlaces.some(
                    (other, j) =>
                      j < i &&
                      Math.hypot(
                        point(other.coordinates)[0] - x,
                        point(other.coordinates)[1] - y,
                      ) < 60,
                  );
                  const offset = crowded ? 35 : -30;
                  return (
                    <g
                      key={p.id}
                      className="city-marker"
                      tabIndex={0}
                      role="button"
                      aria-label={`查看${p.name}的旅行`}
                      onClick={() => {
                        if (!suppressClick.current) {
                          const t = trips.find((t) =>
                            t.places.some((tp) => tp.id === p.id),
                          );
                          if (t) onOpenTrip(t);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const t = trips.find((t) =>
                            t.places.some((tp) => tp.id === p.id),
                          );
                          if (t) onOpenTrip(t);
                        }
                      }}
                    >
                      <circle cx={x} cy={y} r="13" className="pin-halo" />
                      <circle cx={x} cy={y} r="5" className="map-dot" />
                      <line
                        x1={x}
                        y1={y + (offset > 0 ? 8 : -8)}
                        x2={x}
                        y2={y + offset}
                        stroke="#79876b"
                        strokeWidth="1"
                      />
                      <rect
                        x={x - 34}
                        y={y + offset - 13}
                        width="68"
                        height="27"
                        rx="7"
                        className="country-label-bg"
                      />
                      <text
                        x={x}
                        y={y + offset + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="country-label"
                      >
                        {p.name}
                      </text>
                    </g>
                  );
                })}
            </g>
          </svg>
        )}
        <div className="map-controls">
          <button
            aria-label="放大地图"
            onClick={() => changeZoom(0.4)}
            disabled={zoom >= 3}
          >
            <Plus size={18} />
          </button>
          <button
            aria-label="缩小地图"
            onClick={() => changeZoom(-0.4)}
            disabled={zoom <= 1}
          >
            <Minus size={18} />
          </button>
          <span />
          <button aria-label="重置地图视角" onClick={reset}>
            <LocateFixed size={18} />
          </button>
        </div>
        <div className="map-compass" aria-hidden="true">
          <span>N</span>
          <Compass size={25} strokeWidth={1} />
        </div>
        {hover && <span className="map-hover-label">{hover}</span>}
      </div>
      <div className="map-card-bottom">
        <div className="map-legend">
          <span>
            <i className="visited-key" /> 已留下足迹
          </span>
          <span>
            <i className="unvisited-key" /> 等我们出发
          </span>
        </div>
        <span className="map-hint">
          {country
            ? "点击城市，打开旅行回忆"
            : "点击已点亮的国家，探索城市足迹"}{" "}
          <ArrowUpRight size={13} />
        </span>
      </div>
      <div className="country-chips" aria-label="已到访的国家">
        {[...visited].map((code) => (
          <button
            key={code}
            className={country === code ? "active" : ""}
            onClick={() => onCountry(country === code ? null : code)}
          >
            {flag(code)}
            <span>{countryName(code)}</span>
            <small>
              {
                new Set(
                  trips.flatMap((t) =>
                    t.places.filter((p) => p.country === code).map((p) => p.id),
                  ),
                ).size
              }{" "}
              城市
            </small>
            {country === code ? (
              <ArrowLeft size={13} />
            ) : (
              <ArrowUpRight size={13} />
            )}
          </button>
        ))}
        {!visited.size && <p>记录第一段旅行，点亮我们的第一处足迹。</p>}
      </div>
      <p className="map-attribution">Natural Earth · 示意地图</p>
    </section>
  );
}
