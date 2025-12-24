# GraphML Visualizer

Full-stack приложение для визуализации GraphML файлов с интерактивным графовым интерфейсом.

## Структура проекта

```
graph/
├── backend/              # Go Gin API сервер
│   ├── main.go          # REST API для парсинга GraphML
│   ├── sample.graphml   # Пример GraphML файла
│   ├── go.mod
│   └── README.md
│
└── my-react-ts-app/     # React + TypeScript фронтенд
    ├── src/
    │   ├── components/  # React компоненты
    │   │   ├── FileUploader.tsx
    │   │   └── GraphVisualization.tsx
    │   ├── types.ts
    │   └── App.tsx
    └── FRONTEND_README.md
```

## Быстрый старт

### Docker (рекомендуется)

```bash
docker-compose up -d
```

Приложение откроется на `http://localhost:3000`

**Остановка:**
```bash
docker-compose down
```

См. [DOCKER.md](DOCKER.md) для подробной информации.

### Автоматический запуск (без Docker)

```bash
./run.sh
```

Скрипт автоматически запустит бэкенд и фронтенд. Приложение откроется на `http://localhost:5173`

**Остановка:**
```bash
./stop.sh
```

### Ручной запуск

<details>
<summary>Развернуть инструкции по ручному запуску</summary>

#### 1. Запуск бэкенда

```bash
cd backend
$HOME/go1.23.5/bin/go run main.go
```

Сервер запустится на `http://localhost:8080`

#### 2. Запуск фронтенда

```bash
cd my-react-ts-app
npm run dev
```

Приложение откроется на `http://localhost:5173`

</details>

### Использование

1. Откройте `http://localhost:5173` в браузере
2. Нажмите "Choose GraphML file"
3. Выберите файл `backend/sample.graphml`
4. Граф автоматически визуализируется!

## Возможности

### Backend (Go + Gin)
- ✅ Парсинг GraphML файлов с помощью `github.com/freddy33/graphml`
- ✅ REST API endpoint `POST /parse`
- ✅ CORS поддержка для фронтенда
- ✅ Извлечение узлов и рёбер с метаданными
- ✅ Валидация GraphML данных (обязательные поля, допустимые значения)
- ✅ Проверка существования узлов для рёбер

### Frontend (React + TypeScript)
- ✅ Загрузка GraphML файлов через drag-and-drop или выбор
- ✅ Интерактивная визуализация с React Flow
- ✅ Автоматическое расположение узлов
- ✅ Zoom, Pan, перетаскивание узлов
- ✅ Красивый градиентный UI

## Технологии

**Backend:**
- Go 1.23.5
- Gin Web Framework
- freddy33/graphml

**Frontend:**
- React 18
- TypeScript
- Vite
- React Flow
- CSS3

## API

### POST /parse

Принимает GraphML строку и возвращает структурированные данные графа.

**Request:**
```json
{
  "graphml": "<?xml version=\"1.0\"?>..."
}
```

**Response (Success):**
```json
{
  "nodes": [
    {
      "id": "svc_api",
      "label": "API Gateway",
      "type": "service"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "label": "login/refresh",
      "source": "svc_api",
      "target": "svc_auth",
      "kind": "sync",
      "criticality": "high",
      "pair": "svc_api -> svc_auth"
    }
  ]
}
```

**Response (Validation Error):**
```json
{
  "error": "Failed to parse GraphML: node 'n1': missing required field 'type'"
}
```

## Управление сервисами

### run.sh

Автоматически запускает бэкенд и фронтенд в фоновом режиме.

**Возможности:**
- ✅ Проверка наличия Go и зависимостей
- ✅ Запуск обоих сервисов в фоне
- ✅ Сохранение PID процессов
- ✅ Логирование в файлы
- ✅ Красивый цветной вывод

**Логи:**
- Backend: `backend/backend.log`
- Frontend: `my-react-ts-app/frontend.log`

### stop.sh

Корректно останавливает все запущенные сервисы.

**Возможности:**
- ✅ Остановка процессов по PID
- ✅ Graceful shutdown с таймаутом
- ✅ Force kill если процесс не завершается
- ✅ Очистка портов 8080 и 5173
- ✅ Удаление PID файлов

## Валидация GraphML

Backend выполняет строгую валидацию GraphML данных:

**Обязательные поля:**
- Node: `label`, `type` (service, db, cache, queue, external)
- Edge: `kind` (sync, async, stream), `criticality` (low, medium, high)

**Дополнительные проверки:**
- Все `source` и `target` рёбер должны существовать в графе

См. [VALIDATION.md](VALIDATION.md) для подробной информации и примеров.

## Разработка

См. подробные инструкции:
- [Backend README](backend/README.md)
- [Frontend README](my-react-ts-app/FRONTEND_README.md)
- [Docker Deployment](DOCKER.md)
- [Validation Rules](VALIDATION.md)

## Лицензия

MIT
