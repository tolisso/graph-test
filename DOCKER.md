# Docker Deployment

Этот документ описывает, как запустить приложение Graph с использованием Docker.

## Структура

- `backend/` - Go API сервер (порт 8080)
- `my-react-ts-app/` - React фронтенд (порт 80 в контейнере, 3000 снаружи)
- `docker-compose.yml` - конфигурация оркестрации

## Запуск

Запустить оба сервиса:

```bash
sg docker -c "docker-compose up -d"
```

Или если ваш пользователь в группе docker:

```bash
docker-compose up -d
```

Запустить с пересборкой образов:

```bash
sg docker -c "docker-compose up -d --build"
```

## Доступ

- Фронтенд: http://localhost:3000
- API (через nginx proxy): http://localhost:3000/api/parse

## Остановка

```bash
docker-compose down
```

Остановка с удалением volume:

```bash
docker-compose down -v
```

## Логи

Посмотреть логи всех сервисов:

```bash
docker-compose logs -f
```

Логи конкретного сервиса:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Сеть

Оба сервиса находятся в одной Docker сети `graph-network`:
- `backend` - доступен внутри сети по имени `backend:8080`
- `frontend` - доступен снаружи на порту 3000

## Окружение

### Backend
- `GIN_MODE=release` - production режим Gin framework

### Frontend
- `VITE_API_URL=/api` - URL для API запросов (проксируется через nginx)

## Архитектура

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ :3000
       ▼
┌─────────────┐
│   Nginx     │  Frontend
│  (port 80)  │
└──────┬──────┘
       │
       ├─ / ────────► Static files
       │
       └─ /api/* ───► Backend :8080
                      (proxy_pass)
```

## Разработка

Для локальной разработки используйте:

```bash
# Backend
cd backend && go run main.go

# Frontend
cd my-react-ts-app && npm run dev
```

В режиме разработки фронтенд будет использовать `VITE_API_URL=http://localhost:8080` из `.env.development`.
