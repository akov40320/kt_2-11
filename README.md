# Комплект КТ (2–11)

Структура:
- /kt2  — WebStorage + HTML-таблица
- /kt3  — IndexedDB CRUD + таблица
- /kt4  — Геолокация + LocalStorage + IndexedDB
- /kt5  — Аудио/Видео + Canvas + обработка изображений
- /kt6  — Fetch + WebSocket + Server-Sent Events (SSE) (нужен Node.js сервер)
- /kt7  — FileReader API: мини «файловое хранилище» в localStorage
- /kt8  — Канбан (Drag & Drop) + localStorage
- /kt9  — FileReader + Drag&Drop + Geolocation + MediaDevices (камера)
- /kt10 — Мини-SPA (History API)
- /kt11 — History + Canvas animation + Web Worker + Notifications

## Как открыть
Это статические проекты. Откройте `index.html` нужной папки через Live Server (VS Code) или любой локальный сервер.
(Некоторые API не работают при открытии как `file://` — лучше `http://localhost`.)

## KT6 (сервер)
Нужен Node.js 18+.

```bash
cd kt6/server
npm i
npm run dev
```

Сервер по умолчанию: `http://localhost:3000`
WebSocket: `ws://localhost:3000/ws`
SSE: `http://localhost:3000/events`

Клиент: `kt6/index.html` (можно открыть через Live Server).

## Публикация на GitHub Pages
Вариант 1: один репозиторий, Pages из ветки `main` и папки `/`:
- залейте весь проект в репозиторий
- Settings → Pages → Deploy from a branch → `main` / `/root`

Тогда будут доступны:
- `https://<username>.github.io/<repo>/` (общая страница)
- `.../<repo>/kt2/`, `.../<repo>/kt3/` и т.д.

⚠️ KT6: WebSocket/SSE требуют отдельного backend-хостинга (Render/Fly.io/VPS). GitHub Pages — только статический хостинг.
