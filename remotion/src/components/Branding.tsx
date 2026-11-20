import { Logo } from "./Logo";

/** Водяной знак — логотип ANEK● в правом верхнем углу на всё видео. */
export const Watermark = () => (
  <div style={{ position: "absolute", top: 56, right: 56, opacity: 0.75 }}>
    <Logo size={42} stroke="#00000088" />
  </div>
);
