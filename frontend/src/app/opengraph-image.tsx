import { ImageResponse } from "next/og";

export const alt = "GulDar Group — ремонт офисов и магазинов под ключ в Алматы";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Next's bundled Geist font includes Cyrillic: no remote font fetch at render time.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#101f30", color: "#f7f9fc", padding: 60, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 90% 15%, #274c68 0%, #101f30 65%)" }} />
        <div style={{ display: "flex", position: "absolute", top: 0, right: 0, width: 22, height: "100%", background: "#f8b83e" }} />

        <svg width="440" height="440" viewBox="0 0 440 440" style={{ position: "absolute", right: 30, top: 155 }}>
          <path d="M35 310 211 400 408 302" stroke="#47718d" strokeWidth="2" fill="none" />
          <path d="M80 155 246 235 246 355 80 275Z" fill="#1c384e" stroke="#6593ad" strokeWidth="2" />
          <path d="M246 235 366 175 366 295 246 355Z" fill="#142e44" stroke="#6593ad" strokeWidth="2" />
          <path d="M80 155 200 95 366 175 246 235Z" fill="#30516a" stroke="#91b0c4" strokeWidth="2" />
          <path d="M80 198 246 278 366 218M80 238 246 318 366 258" fill="none" stroke="#6b98b1" strokeWidth="2" />
          <path d="M121 175V295M163 195V315M204 215V335M286 215V335M326 195V315" fill="none" stroke="#6b98b1" strokeWidth="2" />
          <path d="M80 155 246 235 366 175" fill="none" stroke="#f8b83e" strokeWidth="6" />
          <path d="M211 382V421M24 323 211 418 420 315" fill="none" stroke="#41647d" strokeWidth="1" />
          <path d="M35 291V91M28 91H42M28 291H42" fill="none" stroke="#41647d" strokeWidth="1" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", position: "relative", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ display: "flex", width: 48, height: 48, border: "3px solid #f8b83e", alignItems: "center", justifyContent: "center", color: "#f8b83e", fontSize: 25, fontWeight: 700 }}>G</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>GulDar Group</div>
          </div>
          <div style={{ display: "flex", color: "#f8b83e", fontSize: 18, letterSpacing: 3, marginTop: 48 }}>СТРОИТЕЛЬНАЯ КОМПАНИЯ · АЛМАТЫ</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2, marginTop: 22 }}>
            <span>Ремонт офисов</span>
            <span>и магазинов</span>
            <span style={{ color: "#f8b83e" }}>под ключ.</span>
          </div>
          <div style={{ display: "flex", gap: 18, fontSize: 21, color: "#c6d4df", marginTop: 35 }}>
            <span>Проект</span><span style={{ color: "#f8b83e" }}>•</span>
            <span>Смета</span><span style={{ color: "#f8b83e" }}>•</span>
            <span>Результат</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
