/** Central controls: larger scrub/scrollDuration = slower; larger damping = faster settling. */
export const animationConfig = {
  scrollDuration: 1.15,
  scrub: 0.8,
  damping: 7,
  roomRotation: (120 * Math.PI) / 180,
  headerDuration: 0.72,
  railDuration: 0.85,
  revealDuration: 0.9,
} as const;

export const SCENE_STAGES = [
  { progress: 0, title: "Черновое помещение", short: "Начало" },
  { progress: 0.3, title: "Стены и напольные покрытия", short: "Отделка" },
  { progress: 0.48, title: "Электрика и освещение", short: "Сети" },
  { progress: 0.72, title: "Витрина и оборудование", short: "Оснащ." },
  { progress: 1, title: "Готовое пространство для бизнеса", short: "Готово" },
] as const;
