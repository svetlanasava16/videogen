import type { CSSProperties, ReactNode } from "react";

/** Слой на весь кадр (как AbsoluteFill Remotion, но без Remotion): абсолютный, во всю ширину и высоту, flex-колонка. */
export const Fill = ({ style, children }: { style?: CSSProperties; children?: ReactNode }) => (
  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", ...style }}>{children}</div>
);
