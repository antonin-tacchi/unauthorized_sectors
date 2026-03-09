import { useState } from "react";

// Placeholder SVG inline — ne peut jamais casser
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23101828'/%3E%3Cpath d='M6 3.5L10 4.5 8 6z' fill='%23ffffff18'/%3E%3Ccircle cx='10' cy='3' r='1' fill='%23ffffff18'/%3E%3C/svg%3E";

export default function SafeImage({
  src,
  alt = "",
  className = "",
  fallbackSrc = PLACEHOLDER,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
      }}
    />
  );
}
