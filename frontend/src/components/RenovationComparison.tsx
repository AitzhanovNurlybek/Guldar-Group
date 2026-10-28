"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Container } from "./Container";
import "./renovation-comparison.css";

export function RenovationComparison() {
  const [position, setPosition] = useState(50);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const rangeRef = useRef<HTMLInputElement>(null);
  const suffix = attempt ? `?retry=${attempt}` : "";

  function moveToPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPosition(Math.round(Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100))));
  }

  return (
    <figure className="renovation-comparison" aria-label="Магазин электроники до и после ремонта">
      <div
        className="renovation-comparison-frame"
        style={{ "--comparison-position": `${position}%` } as CSSProperties}
        onPointerDown={(event) => {
          if (failed || !event.isPrimary || event.button !== 0) return;
          event.preventDefault();
          rangeRef.current?.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          moveToPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) moveToPointer(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            moveToPointer(event);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        {(["after", "before"] as const).map((stage) => (
          <picture className={`renovation-comparison-image renovation-comparison-${stage}`} key={`${stage}-${attempt}`}>
            <source
              type="image/webp"
              srcSet={[640, 960, 1536].map((width) => `/images/retail-${stage}-${width}.webp${suffix} ${width}w`).join(", ")}
              sizes="100vw"
            />
            <Image
              src={`/images/retail-${stage}-1536.webp${suffix}`}
              width={1536}
              height={1024}
              alt={stage === "before"
                ? "Визуализация магазина до ремонта: черновые стены, бетонный пол и витрины слева"
                : "Визуализация того же магазина после ремонта: стойки со смартфонами, ноутбуки и готовая отделка"}
              loading="eager"
              fetchPriority={stage === "after" ? "high" : "auto"}
              draggable={false}
              onError={() => setFailed(true)}
            />
          </picture>
        ))}
        <span className="renovation-comparison-label renovation-comparison-label-before" aria-hidden="true">До ремонта</span>
        <span className="renovation-comparison-label renovation-comparison-label-after" aria-hidden="true">После ремонта</span>
        <input
          ref={rangeRef}
          className="renovation-comparison-range"
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          disabled={failed}
          aria-label="Граница сравнения до и после ремонта"
          aria-describedby="renovation-comparison-help"
          aria-valuetext={`До ремонта: ${position}%. После ремонта: ${100 - position}%.`}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
        <div className="renovation-comparison-divider" aria-hidden="true">
          <span className="renovation-comparison-handle">
            <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
              <path d="m9 7-5 5 5 5m10-10 5 5-5 5M14 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        {failed && <div className="renovation-comparison-error" role="alert">
          <p>Не удалось загрузить изображения.</p>
          <button type="button" className="btn btn-ghost" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>Повторить загрузку</button>
        </div>}
      </div>
      <figcaption>
        <Container className="renovation-comparison-caption">
          <div><p className="renovation-comparison-title">Магазин электроники. До и после.</p><p id="renovation-comparison-help">Потяните ползунок, чтобы сравнить. С клавиатуры: стрелки влево и вправо.</p></div>
          <span className="renovation-comparison-disclosure">AI-визуализация</span>
        </Container>
      </figcaption>
    </figure>
  );
}
