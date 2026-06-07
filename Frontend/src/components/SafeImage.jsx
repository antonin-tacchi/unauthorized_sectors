import { useEffect, useRef, useState } from "react";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23101828'/%3E%3Cpath d='M6 3.5L10 4.5 8 6z' fill='%23ffffff18'/%3E%3Ccircle cx='10' cy='3' r='1' fill='%23ffffff18'/%3E%3C/svg%3E";

export default function SafeImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  fallbackSrc = PLACEHOLDER,
  style,
  loading: _loading,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // Sync quand src change (ex: changement de thumb)
  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setLoaded(false);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si l'image est déjà en cache, onLoad ne se déclenche pas — on check complete
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [imgSrc]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-white/10 rounded" />
      )}
      <img
        {...props}
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
          setLoaded(true);
        }}
      />
    </div>
  );
}
