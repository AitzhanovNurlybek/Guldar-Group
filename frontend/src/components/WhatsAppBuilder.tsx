"use client";

import { useState } from "react";
import { Icon, WhatsAppIcon } from "./Icons";
import { site, waLink } from "@/lib/site";

const tasks = [
  "Проектирование",
  "Дизайн-проект",
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
      <legend className="text-sm font-semibold text-fg-2">{label}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : o)}
              className="choice-chip min-h-11 max-w-full rounded-md border border-line-strong bg-ink-900 px-3 py-2 text-sm font-medium text-fg-2 transition-colors duration-150"
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
  const hasDetails = Boolean(task || place || term || area || note);
  const reset = () => { setTask(null); setPlace(null); setTerm(null); setArea(""); setNote(""); };

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
    <div className="whatsapp-builder grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="min-w-0 space-y-6">
        <div className="builder-intro"><p>Все поля необязательны. Можно просто написать нам.</p><button type="button" className="builder-reset" disabled={!hasDetails} onClick={reset}>Сбросить выбор</button></div>
        <Chips label="Что нужно сделать" options={tasks} value={task} onChange={setTask} />
        <Chips label="Какой объект" options={places} value={place} onChange={setPlace} />
        <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
          <label className="block">
            <span className="text-sm font-semibold text-fg-2">Площадь, м²</span>
            <input
              name="area"
              inputMode="numeric"
              value={area}
              onChange={(e) => setArea(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Например, 120"
              className="mt-2.5 h-11 w-full rounded-xl border border-line-strong bg-ink-900/60 px-4 text-fg placeholder:text-fg-3 focus:border-safety focus:outline-none"
            />
          </label>
          <Chips label="Когда начать" options={terms} value={term} onChange={setTerm} />
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-fg-2">Комментарий</span>
          <textarea
            name="comment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Например: заменить освещение в торговом зале, работать ночью"
            className="mt-2.5 w-full resize-y rounded-xl border border-line-strong bg-ink-900/60 px-4 py-3 text-fg placeholder:text-fg-3 focus:border-safety focus:outline-none"
          />
        </label>
      </div>

      {/* Превью: так сообщение увидит менеджер */}
      <div className="message-preview flex min-w-0 flex-col rounded-2xl border border-line bg-ink-950/70 p-5">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <span className="message-channel-icon grid size-10 place-items-center rounded-lg">
            <WhatsAppIcon className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Сообщение для {site.name}</p>
            <p className="text-xs text-fg-3">{site.phone}</p>
          </div>
        </div>
        <div className="flex flex-1 items-end py-5">
          <div
            aria-label="Предпросмотр сообщения"
            className="min-w-0 rounded-lg px-4 py-3 text-[0.93rem] leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]"
          >
            {message}
          </div>
        </div>
        <a href={waLink(message)} target="_blank" rel="noopener noreferrer" className="btn btn-accent w-full">
          <WhatsAppIcon />
          Открыть WhatsApp
        </a>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-fg-3">
          <Icon name="check" className="size-3.5" />
          Сообщение отправите вы. Фото можно добавить в чате.
        </p>
      </div>
    </div>
  );
}
