# GulDar Group

Сайт ТОО «GulDar Group» (Алматы).

| Папка | Что внутри | Стек |
|---|---|---|
| [`frontend/`](frontend/) | сайт | Next.js 16, TypeScript, Tailwind CSS 4 |
| [`backend/`](backend/) | API: заявки, данные сайта | FastAPI, Python 3.11+ |

## Быстрый старт

```bash
# бэкенд — http://localhost:8000
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# фронтенд — http://localhost:3000 (в другом терминале)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Подробности — в README каждой папки.

## Статус

Скелет проекта. Контент-заглушки помечены `TODO`.
