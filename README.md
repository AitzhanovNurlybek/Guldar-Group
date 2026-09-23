# GulDar Group — сайт

Сайт ТОО «GulDar Group» (Алматы): обслуживание и ремонт коммерческой недвижимости, поставка электротехники и стройматериалов.

**Статус:** скелет. Тексты-заглушки помечены `TODO`.

## Стек

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4

## Запуск

```bash
npm install
npm run dev   # http://localhost:3000
```

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
- [ ] Отправка формы заявки (Telegram / почта)
- [ ] Портфолио объектов, отзывы
- [ ] Карта 2GIS на странице контактов
- [ ] Деплой на Vercel, домен
