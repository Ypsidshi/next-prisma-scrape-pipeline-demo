# Smoke-проверка (локально)

| Проверка | Результат |
|----------|-----------|
| `docker compose up -d --build db web` (БД **5436**, веб **3002**) | OK |
| HTTP `http://localhost:3002/` | 200 |
| `npm run lint` | OK |
| `npm run build` | OK |

Скриншот: `docs/screenshots/home.png`.
