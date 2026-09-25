import type { IconName } from "@/components/Icons";

// Данные компании в одном месте.
// Источники: guldargroup.satu.kz, 2gis.kz, uchet.kz, листовка компании (на 2026-09).
// Всё, что помечено TODO, подтвердить у заказчика.

export const site = {
  name: "GulDar Group",
  legalName: "ТОО «GulDar Group»",
  motto: "Property · Building · Service",
  tagline: "Ремонт офисов и коммерческих помещений в Алматы",
  phone: "+7 778 681 29 31", // satu.kz + 2GIS
  whatsapp: "77786812931", // TODO: подтвердить, что WhatsApp на этом номере (2GIS: WhatsApp, Telegram)
  email: "guldargroup@bk.ru",
  address: "Алматы, ул. Толе би, 305, офис 27, 2 этаж", // 2GIS; на satu.kz — «Толе би, 305/1»
  hours: "Ежедневно, 9:00–20:00", // satu.kz; на spravker — пн–пт 9–18. TODO
  foundedYear: 2015, // регистрация 23.02.2015
  bin: "150240026941",
  gis: "https://2gis.kz/almaty/firm/70000001056080086",
  satu: "https://guldargroup.satu.kz",
};

export function waLink(text: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const waGreeting = "Здравствуйте! Хочу обсудить объект.";

export const nav = [
  { href: "/", label: "Главная", icon: "home" },
  { href: "/uslugi", label: "Услуги и цены", icon: "wrench" },
  { href: "/produkciya", label: "Поставка", icon: "box" },
  { href: "/o-kompanii", label: "О компании", icon: "building" },
  { href: "/kontakty", label: "Контакты", icon: "pin" },
] as const;

export type Service = {
  slug: string;
  title: string;
  text: string;
  price?: string;
  icon: IconName;
};

export const serviceGroups: { title: string; lead: string; items: Service[] }[] = [
  {
    title: "Ремонт и отделка",
    lead: "Офисы, магазины, салоны, кафе и склады.",
    items: [
      {
        slug: "pod-klyuch",
        title: "Ремонт под ключ",
        text: "Берём объект целиком: демонтаж, инженерия, отделка, сдача. Один договор и один ответственный.",
        icon: "key",
      },
      {
        slug: "kapitalnyy",
        title: "Капитальный ремонт",
        text: "Меняем инженерные сети, перегородки, полы и потолки.",
        icon: "helmet",
      },
      {
        slug: "kosmeticheskiy",
        title: "Косметический ремонт",
        text: "Покраска, потолки, напольные покрытия — обновляем помещение без перепланировки.",
        icon: "brush",
      },
      {
        slug: "otdelka",
        title: "Отделочные работы",
        text: "Черновая и чистовая отделка стен, полов и потолков, укладка керамогранита.",
        price: "от 30 000 ₸/м²",
        icon: "layers",
      },
      {
        slug: "melkiy",
        title: "Мелкий ремонт",
        text: "Дверь, светильник, плитка, розетка — приезжаем даже на одну задачу.",
        price: "от 10 000 ₸",
        icon: "sparkle",
      },
      {
        slug: "rekonstrukciya",
        title: "Реконструкция",
        text: "Перепланировка, усиление конструкций, смена назначения помещения.",
        icon: "frame",
      },
      {
        slug: "fasad",
        title: "Фасадные работы",
        text: "Облицовка, утепление и ремонт фасадов.",
        icon: "facade",
      },
      {
        slug: "demontazh",
        title: "Демонтажные работы",
        text: "Разбираем старую отделку, перегородки и инженерные системы.",
        icon: "demolish",
      },
    ],
  },
  {
    title: "Инженерные системы",
    lead: "Монтаж, замена и аварийный ремонт.",
    items: [
      {
        slug: "elektromontazh",
        title: "Электромонтажные работы",
        text: "Проводка, щиты, освещение, розеточные группы. Материалы поставляем сами.",
        icon: "bolt",
      },
      {
        slug: "santehnika",
        title: "Сантехнические работы",
        text: "Водопровод, канализация, отопление, прочистка засоров.",
        price: "от 30 000 ₸",
        icon: "drop",
      },
    ],
  },
  {
    title: "Обслуживание зданий",
    lead: "Для сетей, офисов и торговых центров.",
    items: [
      {
        slug: "kto",
        title: "Комплексное техническое обслуживание",
        // TODO: уточнить формат КТО — график осмотров, время выезда, что входит в абонемент
        text: "Электрика, сантехника и мелкий ремонт по договору обслуживания — без своего штата мастеров.",
        icon: "shield",
      },
    ],
  },
  {
    title: "Строительство",
    lead: "От проекта до сдачи объекта.",
    items: [
      {
        slug: "metallokonstrukcii",
        title: "Здания из металлоконструкций",
        text: "Склады, ангары, торговые павильоны.",
        price: "от 120 000 ₸/м²",
        icon: "building",
      },
      {
        slug: "proektirovanie",
        title: "Проектирование",
        text: "Готовим проект и смету до начала работ, ведём объект до сдачи.",
        icon: "ruler",
      },
    ],
  },
];

export const services = serviceGroups.flatMap((g) => g.items);

// Короткий список для главной — самое востребованное
export const featuredServices = ["pod-klyuch", "kto", "elektromontazh", "santehnika", "otdelka", "melkiy"].map(
  (slug) => services.find((s) => s.slug === slug)!,
);

export const productGroups: { title: string; text: string; icon: IconName }[] = [
  // TODO: бренды, наличие, минимальный заказ — уточнить у заказчика
  { title: "Электротехническая продукция", text: "Кабель, автоматы, щиты, светильники.", icon: "cable" },
  { title: "Строительные материалы", text: "Смеси, гипсокартон, плитка, отделочные материалы.", icon: "brick" },
  { title: "Инструменты", text: "Ручной и электроинструмент для бригад и объектов.", icon: "hammer" },
  { title: "Запорная арматура", text: "Краны, задвижки и клапаны для промышленных объектов.", icon: "valve" },
];

// satu.kz → «Основные клиенты». TODO: подтвердить, что названия можно показывать на сайте
export const clients = ["Sulpak", "Kcell", "Evrika", "Jusan Mobile", "ТД «Пассаж»"];

export const steps = [
  { title: "Пишете в WhatsApp", text: "Адрес, пара фото и задача — этого хватит для начала." },
  { title: "Выезжаем на объект", text: "Смотрим помещение, делаем замеры, уточняем сроки." },
  { title: "Считаем смету", text: "Цену фиксируем в договоре до начала работ." },
  { title: "Делаем ремонт", text: "Контролируем качество на каждом этапе." },
  { title: "Сдаём объект", text: "Подписываем акт и даём гарантию на работы." },
];

export const advantages = [
  { title: "Официальный договор", text: "Работаем как ТОО: договор, счёт, акт выполненных работ." },
  { title: "Гарантия на работы", text: "Если что-то пошло не так после сдачи — исправляем." }, // TODO: срок гарантии
  { title: "Одна бригада на всё", text: "Электрика, сантехника, отделка и фасад — без пяти разных подрядчиков." },
  { title: "Материалы от нас", text: "Сами поставляем электротехнику и стройматериалы — не ждём поставщиков." },
];

// Фото объектов: положите файлы в public/photos/ и перечислите здесь.
// Пока список пуст — блок «Объекты» на сайте скрыт.
export const projects: { title: string; place: string; image: string }[] = [
  // { title: "Ремонт торгового зала", place: "ТРЦ, Алматы", image: "/photos/01.jpg" },
];

// 3D-модели для главной. По умолчанию объекты рисуются кодом.
// Чтобы заменить объект своей моделью — положите .glb в public/models/ и укажите путь, например "/models/cabinet.glb".
export const heroModels: Record<"tower" | "cabinet" | "valve" | "helmet" | "roller" | "bulb", string | null> = {
  tower: null,
  cabinet: null,
  valve: null,
  helmet: null,
  roller: null,
  bulb: null,
};
