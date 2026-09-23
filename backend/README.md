# Backend — GulDar Group API

FastAPI · Pydantic Settings · SQLAlchemy (подключить)

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
pytest
```

## Структура

```
app/
  main.py            точка входа, CORS, подключение роутов
  core/config.py     настройки из .env
  api/router.py      общий роутер
  api/routes/        эндпоинты (health, leads)
  schemas/           Pydantic-схемы запросов и ответов
  models/            ORM-модели (TODO)
  services/          бизнес-логика, уведомления (TODO)
tests/
```

## Эндпоинты

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/health` | проверка, что сервис жив |
| POST | `/api/leads` | заявка с формы сайта (пока без сохранения) |

## Переменные окружения

Все переменные описаны в [`.env.example`](.env.example).
