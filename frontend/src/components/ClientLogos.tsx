import fs from "node:fs";
import path from "node:path";
import { clients } from "@/lib/site";

// Логотипы клиентов. Проверка файла идёт при сборке: нет файла — показываем название
function hasFile(src: string) {
  return fs.existsSync(path.join(process.cwd(), "public", src));
}

export function ClientLogos({ size = "sm" }: { size?: "sm" | "lg" }) {
  const h = size === "lg" ? "h-16 px-6" : "h-11 px-4";
  return (
    <ul className="flex flex-wrap gap-2.5">
      {clients.map((c) =>
        hasFile(c.logo) ? (
          // Логотипы — в родных цветах на светлой плашке: так читается и тёмный Kcell, и красный Sulpak
          <li key={c.name} className={`flex items-center rounded-xl bg-white/95 shadow-[0_8px_20px_-12px_rgb(0_0_0/0.6)] ${h}`} title={c.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.logo} alt={c.name} className={`w-auto object-contain ${size === "lg" ? "h-8" : "h-6"}`} />
          </li>
        ) : (
          <li key={c.name} className={`flex items-center rounded-xl border border-line bg-ink-900/60 ${h}`} title={c.name}>
            <span className={`font-extrabold tracking-[-0.02em] text-fg-2 ${size === "lg" ? "text-xl" : "text-sm"}`}>{c.name}</span>
          </li>
        ),
      )}
    </ul>
  );
}
