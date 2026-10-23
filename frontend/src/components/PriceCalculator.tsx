"use client";

import { useState } from "react";
import { Icon, WhatsAppIcon } from "./Icons";
import { calculator, waLink } from "@/lib/site";

const { works, extras, urgent, spread } = calculator;
const generalWorks = works.filter((w) => !w.forObject);
const objectWorks = works.filter((w) => w.forObject);

// Округляем до тысячи: точность до тенге в ориентире только сбивает с толку
const money = (n: number) => `${(Math.max(0, Math.round(n / 1000)) * 1000).toLocaleString("ru-RU")} ₸`;

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-fg-2">{label}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`min-h-11 max-w-full rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                on ? "border-safety bg-safety text-[#1a0e02]" : "border-line-strong bg-ink-900/60 text-fg-2 hover:border-safety/50 hover:text-fg"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
        on ? "border-safety/60 bg-safety/10" : "border-line-strong bg-ink-900/60 hover:border-safety/40"
      }`}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-fg-3">{hint}</span>
      </span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-safety" : "bg-line-strong"}`}>
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300 ease-(--ease-fluid) ${
            on ? "translate-x-[1.125rem]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function Stepper({ value, onChange, min, max, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; suffix: string }) {
  const btn = "grid size-11 place-items-center rounded-md border border-line-strong bg-ink-900/60 text-lg font-bold disabled:opacity-40";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Меньше">
        −
      </button>
      <span className="min-w-20 text-center text-sm font-semibold">
        {value} {suffix}
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Больше">
        +
      </button>
    </div>
  );
}

export function PriceCalculator() {
  const [workId, setWorkId] = useState("turnkey"); // «под ключ» — самый частый запрос
  const [area, setArea] = useState(80);
  const [tasks, setTasks] = useState(3);
  const [electric, setElectric] = useState(false);
  const [demolition, setDemolition] = useState(false);
  const [plumbing, setPlumbing] = useState(0);
  const [rush, setRush] = useState(false);

  const work = works.find((w) => w.id === workId)!;
  const perArea = work.unit === "m2";
  const extrasAllowed = perArea && !work.noExtras;

  // Строки расчёта: из них же собирается сообщение в WhatsApp
  const lines: { label: string; sum: number }[] = [];
  //   — неразрывный пробел: число и единица не разъезжаются по строкам
  if (perArea) lines.push({ label: `${work.forObject ? "Ремонт: " + work.label.toLowerCase() : work.label}, ${area} м²`, sum: work.rate * area });
  else lines.push({ label: `${work.label}, ${tasks} ${tasks === 1 ? "задача" : tasks < 5 ? "задачи" : "задач"}`, sum: work.rate * tasks });
  if (extrasAllowed && !work.engineeringIncluded && electric) lines.push({ label: "Электромонтаж", sum: extras.electric * area });
  if (extrasAllowed && demolition) lines.push({ label: "Демонтаж", sum: extras.demolition * area });
  if (extrasAllowed && !work.engineeringIncluded && plumbing > 0) lines.push({ label: `Сантехника, ${plumbing} точ.`, sum: extras.plumbingPoint * plumbing });
  const base = lines.reduce((s, l) => s + l.sum, 0);
  const low = base * (rush ? 1 + urgent : 1);
  const high = low * spread;

  const message = [
    "Здравствуйте! Посчитал ремонт на сайте GulDar Group:",
    ...lines.map((l) => `• ${l.label}`),
    rush ? "• Нужно срочно" : null,
    `Ориентир: ${money(low)} – ${money(high)}. Можно обсудить точную смету?`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      {/* min-w-0: иначе самый широкий неразрывный элемент растягивает колонку шире экрана телефона */}
      <div className="min-w-0 space-y-6">
        <Chips label="Что нужно сделать" options={generalWorks} value={workId} onChange={setWorkId} />
        <Chips label="Или ремонт под ваш объект" options={objectWorks} value={workId} onChange={setWorkId} />

        {perArea ? (
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="calc-area" className="text-sm font-semibold text-fg-2">
                Площадь
              </label>
              <span className="flex items-baseline gap-1">
                <input
                  inputMode="numeric"
                  aria-label="Площадь, м²"
                  value={area}
                  onChange={(e) => setArea(Math.min(5000, Number(e.target.value.replace(/\D/g, "")) || 0))}
                  className="w-20 rounded-lg border border-line-strong bg-ink-900/60 px-2 py-1 text-right text-lg font-extrabold focus:border-safety focus:outline-none"
                />
                <span className="text-sm text-fg-2">м²</span>
              </span>
            </div>
            <input
              id="calc-area"
              type="range"
              min={10}
              max={1000}
              step={5}
              value={Math.min(area, 1000)}
              onChange={(e) => setArea(Number(e.target.value))}
              className="mt-3 w-full accent-[#f5871f]"
            />
            <div className="mt-1 flex justify-between text-xs text-fg-3">
              <span>10 м²</span>
              <span>1000 м²</span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-fg-2">Сколько задач</p>
            <p className="mt-1 text-xs text-fg-3">Заменить розетку, повесить дверь, починить плитку — каждая отдельно</p>
            <div className="mt-3">
              <Stepper value={tasks} onChange={setTasks} min={1} max={30} suffix="шт." />
            </div>
          </div>
        )}

        {extrasAllowed && (
          <div>
            <p className="text-sm font-semibold text-fg-2">Дополнительно</p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {!work.engineeringIncluded && (
                <Toggle label="Электромонтаж" hint="Проводка, щит, освещение" on={electric} onChange={setElectric} />
              )}
              <Toggle label="Демонтаж" hint="Старая отделка и перегородки" on={demolition} onChange={setDemolition} />
            </div>
            {!work.engineeringIncluded && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-strong bg-ink-900/60 px-4 py-2.5">
                <span>
                  <span className="block text-sm font-semibold">Сантехника</span>
                  <span className="block text-xs text-fg-3">Точки: раковина, унитаз, бойлер</span>
                </span>
                <Stepper value={plumbing} onChange={setPlumbing} min={0} max={20} suffix="точ." />
              </div>
            )}
            {work.engineeringIncluded && <p className="mt-2 text-xs text-fg-3">Электрика и сантехника уже входят в ремонт под ключ.</p>}
          </div>
        )}

        <Toggle label="Срочно" hint="Начать в ближайшие дни, работа в две смены" on={rush} onChange={setRush} />
      </div>

      {/* Итог */}
      <div className="flex min-w-0 flex-col rounded-3xl border border-line bg-ink-950/70 p-5 sm:p-6">
        <p className="text-sm font-semibold text-fg-2">Ориентировочно</p>
        <p className="mt-2 text-[clamp(1.5rem,2.4vw+0.8rem,2.8rem)] leading-tight font-extrabold tracking-[-0.03em] tabular-nums" aria-hidden="true">
          {money(low)}
          <span className="block text-[0.55em] font-bold text-fg-2">до {money(high)}</span>
        </p>
        <p className="sr-only" aria-live="polite">Ориентировочная стоимость: от {money(low)} до {money(high)}.</p>
        {perArea && area > 0 && (
          <p className="mt-2 text-sm text-fg-3">
            ≈ {money(low / area)} – {money(high / area)} за м²
          </p>
        )}

        <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          {lines.map((l) => (
            <li key={l.label} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
              <span className="min-w-0 text-fg-2 [overflow-wrap:anywhere]">{l.label}</span>
              <span className="shrink-0 font-semibold tabular-nums">от {money(l.sum)}</span>
            </li>
          ))}
          {rush && (
            <li className="flex justify-between gap-4">
              <span className="text-fg-2">Срочность</span>
              <span className="font-semibold">+{Math.round(urgent * 100)}%</span>
            </li>
          )}
        </ul>

        <div className="mt-auto pt-6">
          <a href={waLink(message)} target="_blank" rel="noopener" className="btn btn-accent w-full">
            <WhatsAppIcon />
            Отправить в WhatsApp
          </a>
          <p className="mt-3 flex gap-1.5 text-xs leading-relaxed text-fg-3">
            <Icon name="check" className="mt-0.5 size-3.5 shrink-0" />
            Ориентир по средним ценам. Точную смету считаем после выезда и фиксируем в договоре.
          </p>
        </div>
      </div>
    </div>
  );
}
