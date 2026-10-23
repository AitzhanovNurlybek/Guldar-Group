/** Larger damping makes the model settle faster after a stage change. */
export const animationConfig = {
  damping: 7,
  roomRotation: (120 * Math.PI) / 180,
  headerDuration: 0.2,
  revealDuration: 0.3,
} as const;

export const SCENE_STAGES = [
  { progress: 0, title: "Черновое помещение", short: "Начало" },
  { progress: 0.3, title: "Стены и напольные покрытия", short: "Отделка" },
  { progress: 0.48, title: "Электрика и освещение", short: "Сети" },
  { progress: 0.72, title: "Витрина и оборудование", short: "Оснащ." },
  { progress: 1, title: "Готовое пространство для бизнеса", short: "Готово" },
] as const;
