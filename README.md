# Async URL Checker

Сервис асинхронной проверки списка URL.

- Бэкенд: Node.js + TypeScript + Express (in-memory хранилище)
- Фронтенд: React + TypeScript + Redux Toolkit (Vite)

## Возможности

- Создание задания со списком URL, асинхронная фоновая обработка
- HEAD-запрос на каждый URL, не более 5 одновременных запросов на задание
- Искусственная задержка 0–10 с перед сохранением результата
- Отмена задания (необработанные URL помечаются как `cancelled`)
- Список заданий со статистикой и детальная информация по каждому URL
- Фронтенд с периодическим опросом активного задания и корректной
  остановкой опроса при смене задания (устаревшие ответы игнорируются)

## API

| Метод  | Путь             | Описание                                  |
| ------ | ---------------- | ----------------------------------------- |
| POST   | `/api/jobs`      | Создать задание `{ "urls": [...] }`       |
| GET    | `/api/jobs`      | Список заданий с краткой статистикой       |
| GET    | `/api/jobs/:id`  | Детали задания (по каждому URL)            |
| DELETE | `/api/jobs/:id`  | Отменить задание                          |

Статусы задания: `pending`, `in_progress`, `completed`, `cancelled`, `failed`.
Статусы URL: `pending`, `in_progress`, `success`, `error`, `cancelled`.

## Локальный запуск

Бэкенд (порт 4000):

```bash
cd server
npm install
npm run dev
```

Фронтенд (порт 5173, проксирует `/api` на `http://localhost:4000`):

```bash
cd client
npm install
npm run dev
```

Откройте http://localhost:5173

### Тесты и линтер

В каждом пакете (`server`, `client`):

```bash
npm run lint    # ESLint
npm test        # Vitest
```

### Переменные окружения (бэкенд)

| Переменная                | Назначение                                              | По умолчанию |
| ------------------------- | ------------------------------------------------------- | ------------ |
| `PORT`                    | Порт HTTP-сервера                                       | `4000`       |
| `CORS_ORIGIN`             | Разрешённые origin через запятую (если не задано — все) | —            |
| `MAX_ARTIFICIAL_DELAY_MS` | Верхняя граница искусственной задержки (0 отключает)    | `10000`      |

## Запуск через Docker

```bash
docker compose up --build
```

- Фронтенд: http://localhost:8080
- Бэкенд: http://localhost:4000

Nginx во фронтенд-контейнере проксирует `/api` на сервис `server`.

## Структура

```
server/   Express API (TypeScript)
  src/
    routes/jobs.ts        REST-эндпоинты
    services/jobProcessor.ts  фоновая обработка (пул 5, задержка, отмена)
    store/jobStore.ts     in-memory хранилище
    types.ts
client/   React + Redux Toolkit (Vite)
  src/
    api/jobsApi.ts        слой работы с API
    store/jobsSlice.ts    глобальное состояние (thunks, loading/error)
    components/           JobForm, JobList, JobDetails
    hooks/usePollJob.ts   опрос активного задания
```
