"use client";

import { useState } from "react";
import { Icon, WhatsAppIcon } from "./Icons";
import { site, waLink } from "@/lib/site";

const tasks = [
  "Ремонт под ключ",
  "Косметический ремонт",
  "Электрика",
  "Сантехника",
  "Техобслуживание",
  "Металлоконструкции",
  "Поставка материалов",
  "Другое",
];
const places = ["Офис", "Магазин", "Торговый центр", "Кафе или ресторан", "Склад", "Другое"];
const terms = ["Срочно", "В течение месяца", "Планирую заранее"];

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-fg-2">{label}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : o)}
              className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.96] ${
                on
                  ? "border-white bg-white text-ink-900"
                  : "border-line-strong bg-white/[0.03] text-fg-2 hover:border-ice-300/40 hover:text-fg"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function WhatsAppBuilder() {
  const [task, setTask] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [term, setTerm] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");

  const lines = [
    "Здравствуйте! Пишу с сайта GulDar Group.",
    task && `Задача: ${task.toLowerCase()}`,
    place && `Объект: ${place.toLowerCase()}`,
    area && `Площадь: ${area} м²`,
    term && `Сроки: ${term.toLowerCase()}`,
    note.trim() && note.trim(),
  ].filter(Boolean) as string[];
  const message = lines.join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-6">
        <Chips label="Что нужно сделать" options={tasks} value={task} onChange={setTask} />
        <Chips label="Какой объект" options={places} value={place} onChange={setPlace} />
        <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
          <label className="block">
            <span className="text-sm font-medium text-fg-2">Площадь, м²</span>
            <input
              inputMode="numeric"
              value={area}
              onChange={(e) => setArea(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="120"
              className="mt-2.5 h-11 w-full rounded-2xl border border-line-strong bg-white/[0.03] px-4 text-fg placeholder:text-fg-3 focus:border-sky-400 focus:outline-none"
            />
          </label>
          <Chips label="Когда начать" options={terms} value={term} onChange={setTerm} />
        </div>
        <label className="block">
          <span className="text-sm font-medium text-fg-2">Комментарий</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Например: заменить освещение в торговом зале, работать ночью"
            className="mt-2.5 w-full resize-none rounded-2xl border border-line-strong bg-white/[0.03] px-4 py-3 text-fg placeholder:text-fg-3 focus:border-sky-400 focus:outline-none"
          />
        </label>
      </div>

      {/* Превью: так сообщение увидит менеджер */}
      <div className="flex flex-col rounded-[26px] border border-line bg-ink-950/50 p-5">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <span className="grid size-10 place-items-center rounded-full bg-wa/15 text-wa">
            <WhatsAppIcon className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{site.name}</p>
            <p className="text-xs text-fg-3">{site.phone}</p>
          </div>
        </div>
        <div className="flex flex-1 items-end py-5">
          <div
            aria-live="polite"
            className="ml-auto max-w-[92%] rounded-2xl rounded-br-md bg-[#0f5f45] px-4 py-3 text-[0.93rem] leading-relaxed whitespace-pre-line text-[#e8fff3] shadow-lg"
          >
            {message}
          </div>
        </div>
        <a href={waLink(message)} target="_blank" rel="noopener" className="btn btn-wa w-full">
          <WhatsAppIcon />
          Отправить в WhatsApp
        </a>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-fg-3">
          <Icon name="check" className="size-3.5" />
          Фото объекта можно прислать следом в чат
        </p>
      </div>
    </div>
  );
}
