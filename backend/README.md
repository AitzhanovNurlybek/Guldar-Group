# Backend — GulDar Group API

FastAPI · Pydantic Settings · SQLAlchemy

## Запуск

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
cp .env.example .env            # заполнить значения
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000/api
- Документация (Swagger): http://localhost:8000/docs

## Тесты

```bash
python -m pytest -q
```

## Структура

```
app/
  main.py            точка входа, CORS, подключение роутов
  core/config.py     настройки из .env
  core/database.py   подключение к БД, сессии, обработка ошибок записи
  api/router.py      общий роутер
  api/routes/        эндпоинты (health, leads)
  schemas/           Pydantic-схемы запросов и ответов
  models/lead.py     заявки и время создания
  services/          бизнес-логика, уведомления (TODO)
tests/
```

## Эндпоинты

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/health` | проверка, что сервис жив |
| POST | `/api/leads` | сохраняет заявку и возвращает реальный ID после commit |

Локально таблица `leads` создаётся автоматически в SQLite при первом обращении. Для production настройте `DATABASE_URL` на PostgreSQL, например `postgresql+psycopg://...`; драйвер входит в зависимости. Пользователь БД должен иметь право создать таблицу при первом запуске. Схема создаётся через `create_all`, последующие изменения схемы потребуют миграции.

На Vercel (`VERCEL=1`) и при `ENVIRONMENT=production` SQLite запрещена: файловая система функций не подходит для постоянного хранения заявок. Без доступной внешней БД API вернёт `503` и предложит WhatsApp. При ошибке транзакция откатывается; ответ и логи не раскрывают SQL, телефон или реквизиты подключения. Уведомления менеджеру ещё не подключены. Формы сайта по-прежнему готовят сообщения WhatsApp.

Тесты используют отдельную временную SQLite-базу для каждого сценария: сохранение и повторное подключение, валидация и границы полей, уникальные ID, rollback, недоступная БД, запрет SQLite на production, CORS и отсутствие публичного чтения заявок.

## Переменные окружения

Все переменные описаны в [`.env.example`](.env.example).
