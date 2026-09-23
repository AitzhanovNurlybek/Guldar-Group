# Frontend — сайт GulDar Group

Сайт ТОО «GulDar Group» (Алматы): обслуживание и ремонт коммерческой недвижимости, поставка электротехники и стройматериалов.

**Статус:** скелет. Тексты-заглушки помечены `TODO`.

## Стек

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4

## Запуск

```bash
cd frontend
npm install
cp .env.example .env.local   # заполнить значения
npm run dev                  # http://localhost:3000
```

Другие команды: `npm run build` — сборка, `npm run lint` — проверка кода.

## Переменные окружения

| Переменная | Что это |
|---|---|
| `NEXT_PUBLIC_API_URL` | адрес бэкенда, по умолчанию `http://localhost:8000/api` |
| `NEXT_PUBLIC_SITE_URL` | публичный адрес сайта |

Шаблон — [`.env.example`](.env.example).

## Структура

```
src/
  app/
    page.tsx            главная
    uslugi/             услуги
    produkciya/         продукция
    o-kompanii/         о компании
    kontakty/           контакты + форма заявки
  components/           Header, Footer, Card, PageHeader, ContactForm
  lib/site.ts           контакты, меню, услуги, товары — править здесь
```

## Что дальше

- [ ] Тексты и контакты от заказчика (`src/lib/site.ts`)
- [ ] Логотип и фирменные цвета (`src/app/globals.css`)
- [ ] Отправка формы заявки на `POST /api/leads` бэкенда
- [ ] Портфолио объектов, отзывы
- [ ] Карта 2GIS на странице контактов
- [ ] Деплой на Vercel, домен
