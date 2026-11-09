"use client";
import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { readPhoto } from "../../lib/local-store";
export function Photo({
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  const [url, setUrl] = useState(src.startsWith("local:") ? "" : src);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl = "";
    let active = true;
    setFailed(false);
    if (!src.startsWith("local:")) {
      setUrl(src);
      return;
    }
    setUrl("");
    readPhoto(src.slice(6))
      .then((blob) => {
        if (active && blob) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        } else if (active) setFailed(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);
  if (failed || !src)
    return (
      <span
        className={`image-placeholder ${props.className ?? ""}`}
        role="img"
        aria-label={`${alt}（暂无照片）`}
      >
        <ImageOff size={24} />
        <span>留一点空白，给下一张回忆</span>
      </span>
    );
  return url ? (
    <img {...props} src={url} alt={alt} onError={() => setFailed(true)} />
  ) : (
    <span
      className={`image-placeholder loading ${props.className ?? ""}`}
      aria-label="照片加载中"
    />
  );
}
