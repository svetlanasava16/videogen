import disclosure from "../../../content/disclosure.json";

const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";

/** Водяной знак ANEK. в правом верхнем углу на всё видео. */
export const Watermark = () => (
  <div
    style={{
      position: "absolute", top: 56, right: 56, fontFamily: FONT, fontWeight: 900, fontSize: 42,
      color: "#ffffff", opacity: 0.7, letterSpacing: "0.02em", WebkitTextStroke: "6px #00000088", paintOrder: "stroke fill",
    }}
  >
    {disclosure.brand}
  </div>
);
