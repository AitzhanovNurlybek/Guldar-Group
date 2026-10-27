# Поиск и публикация GulDar Group

Основное направление сайта — ремонт офисов и магазинов под ключ в Алматы. Для страниц настроены отдельные title, description, canonical и Open Graph. Есть карточка для отправки ссылок, разметка компании GeneralContractor, страницы трёх направлений с разметкой Service и BreadcrumbList, robots.txt и sitemap.xml.

## После покупки домена

1. Подключите домен к production-проекту и HTTPS. Выберите один основной вариант адреса (с `www` или без); остальные перенаправьте на него на стороне хостинга.
2. В переменных production-окружения задайте `NEXT_PUBLIC_SITE_URL=https://ваш-домен.kz` без пути, `SITE_NOINDEX=false` и пересоберите сайт. Этот адрес имеет приоритет над доменом Vercel. `NEXT_PUBLIC_*` фиксируются при сборке.
3. Проверьте исходный HTML главной и страниц услуг: canonical должен указывать на ту же страницу основного домена, robots — `index, follow`. Проверьте `/robots.txt`, `/sitemap.xml` и `/opengraph-image`.
4. Добавьте домен в Google Search Console и подтвердите владение через DNS. Если выбрана проверка HTML-тегом для URL-prefix property, добавьте значение `content` в `GOOGLE_SITE_VERIFICATION` и пересоберите.
5. Отправьте `/sitemap.xml` в Search Console. Проверьте главную и страницу `/uslugi/pod-klyuch` через URL Inspection и разметку через Rich Results Test.

В Vercel Production без `NEXT_PUBLIC_SITE_URL` используется `VERCEL_PROJECT_PRODUCTION_URL`, а при его отсутствии — `https://guldar-group.vercel.app`. Если в production случайно перенесли localhost из `.env.example`, он также заменяется публичным адресом. Локальная разработка, Vercel Preview и окружения с `SITE_NOINDEX=true` получают `noindex, nofollow` и пустую карту сайта. robots.txt разрешает обход, чтобы поисковик мог прочитать noindex. Это настройка поиска, а не защита доступа.

## Что поможет продвижению дальше

- Добавить реальные кейсы ремонта: исходная задача, тип и площадь помещения, состав работ, фотографии до/после, сроки с разрешения заказчика.
- Согласовать фактический адрес, график работы и гарантии; поддерживать одинаковые данные на сайте и в профилях компании на картах.
- Оформить профиль компании в Google Business Profile и указать основной сайт. Публиковать реальные фотографии и собирать подлинные отзывы клиентов.
- После появления данных Search Console оценивать запросы, переходы и заявки, улучшая страницы по реальным вопросам заказчиков.

Даты `lastmod` не генерируются на каждой сборке: в sitemap их стоит добавлять только при учёте реальных изменений содержимого. Разметка не содержит выдуманных рейтингов, отзывов, лицензий или точных цен. Техническая подготовка помогает поисковику понять сайт, но не гарантирует позиции.

## Источники

- [Google: выбор канонического URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: создание и отправка sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: разметка локального бизнеса](https://developers.google.com/search/docs/appearance/structured-data/local-business)
