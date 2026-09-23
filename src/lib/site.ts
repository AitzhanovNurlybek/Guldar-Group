// Данные компании в одном месте. Всё, что помечено TODO, уточнить у заказчика.
export const site = {
  name: "GulDar Group",
  legalName: "ТОО «GulDar Group»",
  tagline: "Обслуживание и ремонт коммерческой недвижимости в Алматы",
  phone: "+7 (000) 000-00-00", // TODO
  email: "info@guldar.kz", // TODO
  address: "г. Алматы, ул. Толе би, 305/1, офис 25", // TODO: проверить актуальность
  hours: "Пн–Пт, 9:00–18:00", // TODO
  foundedYear: 2015,
};

export const nav = [
  { href: "/uslugi", label: "Услуги" },
  { href: "/produkciya", label: "Продукция" },
  { href: "/o-kompanii", label: "О компании" },
  { href: "/kontakty", label: "Контакты" },
];

export const services = [
  {
    slug: "obsluzhivanie",
    title: "Техническое обслуживание зданий",
    text: "Плановое обслуживание инженерных систем коммерческих объектов.", // TODO
  },
  {
    slug: "kapremont",
    title: "Капитальный ремонт",
    text: "Ремонт коммерческой недвижимости под ключ.", // TODO
  },
  {
    slug: "kosmeticheskiy-remont",
    title: "Косметический ремонт",
    text: "Отделочные работы без остановки работы объекта.", // TODO
  },
  {
    slug: "elektromontazh",
    title: "Электромонтажные работы",
    text: "Монтаж и замена электрооборудования.", // TODO
  },
];

export const productGroups = [
  { title: "Электротехническая продукция", text: "Кабель, автоматы, щиты, освещение." }, // TODO
  { title: "Строительные материалы", text: "Материалы для отделки и ремонта." }, // TODO
  { title: "Инструменты", text: "Ручной и электроинструмент." }, // TODO
  { title: "Запорная арматура", text: "Для промышленных объектов." }, // TODO
];
