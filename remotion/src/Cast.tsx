import { AbsoluteFill } from "remotion";
import { characters } from "./registry";
import { Puppet } from "./components/Puppet";

const roles = (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "роль" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "роли" : "ролей"}`;

/** Лист кукол-заглушек: проверка набора до арта из ComfyUI. */
export const Cast = () => {
  const list = Object.values(characters).filter((c) => c.bible);
  const cols = 4;
  return (
    <AbsoluteFill style={{ background: "#f2e6d0", padding: 40, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24 }}>
      {list.map((c) => (
        <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ height: 300 }}>
            <Puppet character={c} speaking={false} emotion="neutral" flip={false} seed={0} />
          </div>
          <div style={{ fontFamily: "Inter, Arial, sans-serif", fontWeight: 800, fontSize: 30, color: "#2b1d14", textAlign: "center" }}>
            {c.name.ru}
          </div>
          <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 20, color: "#5b4636", textAlign: "center" }}>
            {c.name.en} · {c.name.de} · {roles(c.bible!.roles.length)}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
