# Демо: мок-пайплайн (Next.js + Prisma + PostgreSQL)

Портфолио-кейс: **плановый сбор записей** из **только мок-источников** (локальный HTML и внутренний RSS), сохранение в PostgreSQL с **дедупликацией по `externalId`**, учёт **прогонов** (`JobRun`), JSON **API** для списков и статистики.

Репозиторий на GitHub: https://github.com/Ypsidshi/next-prisma-scrape-pipeline-demo

## Стек

- **Next.js 16** (App Router), **TypeScript strict**
- **Prisma** + **PostgreSQL**, миграции через `prisma migrate`
- Планировщик: **`node-cron`** в отдельном процессе — скрипт `npm run worker` (в Docker — сервис `worker` с профилем `with-worker`)
- Валидация запросов: **Zod** на route handlers

API реализованы **только в Next** (route handlers), отдельного NestJS-сервиса нет.

## Порты (локально)

| Сервис | Порт |
|--------|------|
| PostgreSQL (Docker) | **5436** |
| Веб (Docker) | **3002** |

## Быстрый старт (Docker)

1. Скопируйте переменные: `cp .env.example .env` (при необходимости поправьте порты).
2. Поднимите БД и веб:

```bash
docker compose up -d --build db web
```

3. Откройте http://localhost:3002 — миграции применяются при старте контейнера `web`.

Опционально — воркер по cron (каждые 2 минуты, источник по умолчанию — фикстуры):

```bash
docker compose --profile with-worker up -d --build
```

Воркер монтирует исходники и выполняет `npm ci` при старте (удобно для разработки; для продакшена собирайте отдельный образ воркера).

## Локально без Docker (только Node)

1. PostgreSQL 16+ и база `scrape` (или используйте только `docker compose up -d db`).
2. `cp .env.example .env`, выставьте `DATABASE_URL`.
3. Команды:

```bash
npm ci
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Сквозной сценарий для заказчика

1. Поднять `db` (+ `web` или `npm run dev`).
2. Выполнить сид: `npm run db:seed` — в таблицах появятся демо-элементы и один успешный `JobRun`.
3. Открыть главную страницу — видны счётчики, последние прогоны и элементы.
4. Запустить ingestion из фикстур:

```bash
curl -X POST http://localhost:3002/api/pipeline/run ^
  -H "Content-Type: application/json" ^
  -d "{\"source\":\"fixture\"}"
```

Повторный запрос обновит существующие строки по `externalId` (поле `itemsUpdated` в `JobRun`).

5. Запустить ingestion из внутреннего RSS:

```bash
curl -X POST http://localhost:3002/api/pipeline/run ^
  -H "Content-Type: application/json" ^
  -d "{\"source\":\"mock-feed\"}"
```

6. Проверить API: `GET /api/stats`, `GET /api/items`, `GET /api/runs`.

## Compliance и ограничения демо

- В репозитории **нет** обращений к чужим сайтам: только файлы `fixtures/*.html` и маршрут **`GET /mock-feed`** внутри этого приложения.
- Для реальных задач сбора данных нужно самостоятельно проверять **robots.txt**, **условия использования** сайтов, **согласие на обработку ПДн**, соблюдать **частоту запросов** (rate limit) и не нарушать закон о конкуренции и о защите информации.
- Этот репозиторий — **учебный каркас**, а не готовое решение для скрейпинга продакшена.

## Что докупить / доработать под прод

- Аутентификация для ручного запуска пайплайна и админки.
- Настоящая очередь (BullMQ / Redis) вместо простого cron при высокой нагрузке.
- Мониторинг, алёрты по `JobRun` со статусом `FAILED`.
- Отдельный образ воркера без bind-mount исходников.

## Полезные скрипты

| Скрипт | Назначение |
|--------|------------|
| `npm run dev` | Разработка Next |
| `npm run build` / `npm start` | Прод-сборка |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run worker` | Процесс с `node-cron` (см. `.env.example`) |
| `npm run db:seed` | Наполнение демо-данными |
| `npx prisma migrate dev` | Новая миграция в разработке |

## Переменные окружения

См. файл **`.env.example`**.
