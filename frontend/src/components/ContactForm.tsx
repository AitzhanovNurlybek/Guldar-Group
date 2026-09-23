"use client";

import { useState } from "react";

// Каркас формы заявки. Отправка пока не подключена — TODO: API-роут / Telegram / почта.
export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) return <p className="rounded-lg border border-line p-6">Спасибо! Мы свяжемся с вами.</p>;

  return (
    <form
      className="grid gap-4 rounded-lg border border-line p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <input required name="name" placeholder="Имя" className="rounded border border-line bg-background px-3 py-2" />
      <input
        required
        name="phone"
        type="tel"
        placeholder="Телефон"
        className="rounded border border-line bg-background px-3 py-2"
      />
      <textarea
        name="message"
        rows={4}
        placeholder="Опишите объект и задачу"
        className="rounded border border-line bg-background px-3 py-2"
      />
      <button type="submit" className="rounded bg-accent px-4 py-2 font-semibold text-white hover:opacity-90">
        Отправить заявку
      </button>
    </form>
  );
}
