# GulDar Group

Next.js-сайт строительной компании в Алматы. Тексты, контакты, ставки калькулятора и ссылки WhatsApp хранятся в `src/lib/site.ts`; визуальное обновление их не меняет.

## Запуск

```powershell
cd frontend
npm install
npm run dev
```

Откройте http://localhost:3000. Для проверки производительности используйте production:

```powershell
npm run build
npm start
```

Если порт 3000 занят dev-сервером, можно оставить его работающим и запустить `npm start -- --port 3100`.

## Качество и анимация

Основной конфиг качества: `src/components/scene/quality.ts`.

| Уровень | Рендер | DPR | Частицы |
| --- | --- | --- | --- |
| low | Постер | 1 | 0 |
| medium | WebGL | до 1.25 | 0 |
| high | WebGL | до 1.75 | 18 в одном Points |

`webgl` включает сцену, `maxDpr` ограничивает разрешение, `particles` задаёт количество точек. Экраны до 1023 px, сенсорные устройства, reduced motion, save-data, ≤4 ГБ памяти или ≤2 логических ядра используют постер. При просадке FPS PerformanceMonitor уменьшает качество high → medium. Постобработка и динамические тени отключены.

Настройки находятся в `src/components/scene/animation-config.ts`: `damping` управляет инерцией сборки, `roomRotation` — углом, `headerDuration` и `revealDuration` — переходами интерфейса. Пороги подписей заданы в `SCENE_STAGES`. `performanceBudget` задаёт предел рендера 60 кадров/с и задержку загрузки WebGL.

Прокрутка нативная. GSAP и Lenis удалены из зависимостей. `scroll.ts` объединяет события в один requestAnimationFrame и измеряет расположение секций только при изменении размеров. Без активной анимации цикл останавливается. На телефонах сцена меняется только по кнопкам или ползунку; ручной выбор сохраняется при прокрутке. R3F использует `frameloop="never"`; рендер останавливается после завершения изменения, вне экрана и в скрытой вкладке.

Макет находится внутри `.scene-visual`, без фиксированного слоя за страницей. Высота на десктопе — `clamp(340px,42svh,460px)`, на телефоне — `clamp(240px,76vw,360px)`. Блок готового помещения содержит собственное изображение `/scene/d/144.avif`. Сжатые AVIF/WebP отдаются напрямую; сервер не перекодирует каждый выбранный кадр. Заголовки кэша для `/scene/` настроены в `next.config.ts`.

## Модель и шрифты

Готовый интерьер можно вращать в `RoomExplorer`. Его модель `public/scene/room-complete.glb` (около 4,1 МиБ) экспортирована из существующего Blender-исходника и загружается только по нажатию. `RoomOrbitCanvas` использует `frameloop="demand"`, DPR до 1,25, без масштабирования колесом, теней и постобработки. На телефоне обычный свайп прокручивает страницу до включения режима просмотра. Повторная подготовка: Blender с `render/export_web_room.py`, затем `node scripts/optimize-room-explorer.mjs` из frontend.

Модель: `public/scene/room.meshopt.glb`, около 55 КБ, Meshopt. Она содержит объединённые части и два набора InstancedMesh. Освещение рассчитано в вершинах при экспорте, AO запечён в общую WebP-текстуру 256×256. В рантайме нет источников света, shadow maps или полноэкранных эффектов. Геометрия разбита по этапам сборки; это иллюстрация, а не портфолио выполненных работ.

```powershell
npm run model:build
```

Blender для этой сборки не нужен. Лёгкие постеры сохраняются в серверном HTML; на телефоне изображение находится в обычном потоке документа. Ручной выбор стадии на слабом устройстве загружает соответствующий сохранённый AVIF. Старый `SceneFrames.tsx` не импортируется главной страницей.

Manrope и Montserrat подключены через `next/font/local` с `display: swap`. Нужные кириллические и латинские глифы занимают около 39 КБ вместо 96 КБ четырёх исходных файлов. Оригинальные WOFF2 и OFL-лицензии сохранены. Для повторного субсеттинга нужен Python с `fonttools` и `brotli`; скрипт — `scripts/subset-fonts.py`.

## Проверки

После production-запуска на порту 3100:

```powershell
npm run lint
npm run typecheck
npm test
npm run verify:interface
node scripts/audit-performance.mjs current --lighthouse-only
```

Браузерные тесты используют установленный Chrome или Chromium; путь можно задать через `CHROME_PATH`, адрес сайта через `AUDIT_URL`. `verify:interface` и `test:e2e` запускают один набор проверок: 10 страниц на 14 ширинах 320–1920 px, меню и клавиатура, фотографии и PDF, калькулятор, WhatsApp, 3D и поворот телефона. `--quick` оставляет четыре ширины. Отчёт и скриншоты: `reports/verification/`.

`npm test` проверяет выбор canonical-домена. Для тестов нужен Node.js 24. CI в `.github/workflows/tests.yml` запускает backend, lint, unit-тесты, production-сборку и браузерные проверки.

Lighthouse измеряйте отдельно от браузерных тестов, чтобы они не конкурировали за CPU. Для полного аудита прокрутки есть `npm run audit:performance` с CPU 4×.

Результаты, HTML Lighthouse, trace и снимки лежат в `reports/`, папка исключена из Git. Сводка и ограничения измерений — в [PERFORMANCE.md](PERFORMANCE.md). Визуальный контракт — [DESIGN.md](DESIGN.md).

Проверка новых функций: `node scripts/verify-requested-updates.mjs`. Отзывы находятся в `src/lib/testimonials.ts`, оригиналы и миниатюры — в `public/reviews/`. Логотипы из `public/clients/` подготовлены в `public/clients/optimized/`; перечень хранится в `src/lib/site.ts`. Для подготовки этих изображений используются Python, Pillow и PyMuPDF (`prepare-client-logos.py`, `prepare-review-assets.py`). Новые услуги: `/uslugi/proektirovanie` и `/uslugi/dizayn-proekt`.

## Данные и SEO

Главная: `src/app/page.tsx`. Услуги: `src/lib/service-details.ts`. SEO и JSON-LD: `src/lib/seo.ts`. Для реальных кейсов добавьте фотографии в `public/photos` и записи в `projects` из `src/lib/site.ts`.

В Vercel Production canonical по умолчанию берётся из `VERCEL_PROJECT_PRODUCTION_URL`, затем из текущего адреса `guldar-group.vercel.app`. `NEXT_PUBLIC_SITE_URL` переопределяет его; случайно скопированный localhost на production заменяется публичным адресом. Локальная разработка и Vercel Preview получают noindex; для staging есть `SITE_NOINDEX=true`. Настройки домена применяются при сборке; подробнее в [SEO.md](SEO.md). Заявки открывают WhatsApp с готовым сообщением, которое посетитель отправляет самостоятельно.

Готовые WebP/AVIF отдаются напрямую: встроенный `/_next/image` недоступен за текущим Vercel service rewrite. Логотипы и сканы уже сжаты в `public/`; новые фотографии сначала подготовьте для веба. Для логотипов, отзывов и сцены настроен кэш на час с revalidation.
