# Changelog

## 2025-12-24 - Validation & Docker Support

### Added
- ✅ **Строгая валидация GraphML данных**
  - Обязательные поля для узлов: `label`, `type`
  - Обязательные поля для рёбер: `kind`, `criticality`
  - Проверка допустимых значений:
    - `node.type` ∈ {service, db, cache, queue, external}
    - `edge.kind` ∈ {sync, async, stream}
    - `edge.criticality` ∈ {low, medium, high}
  - Проверка существования узлов для рёбер (source/target)
  - Детальные сообщения об ошибках валидации

- ✅ **Docker поддержка**
  - Multi-stage Dockerfile для backend (Go)
  - Multi-stage Dockerfile для frontend (React + Nginx)
  - docker-compose.yml для оркестрации
  - Единая сеть для backend и frontend
  - Nginx проксирование API запросов
  - Оптимизированные .dockerignore файлы

- ✅ **Документация**
  - DOCKER.md - инструкции по использованию Docker
  - VALIDATION.md - правила валидации и примеры
  - Обновлен README.md с информацией о Docker и валидации

### Changed
- **Backend API Response** - добавлены новые поля:
  - `node.type` - тип узла
  - `edge.kind` - тип связи
  - `edge.criticality` - уровень критичности

- **Frontend** - поддержка переменных окружения:
  - `.env.production` - для Docker (использует `/api`)
  - `.env.development` - для локальной разработки (использует `http://localhost:8080`)

### Technical Details
- Backend размер образа: 37.1 MB
- Frontend размер образа: 54.1 MB
- Порты:
  - Frontend: 3000 (снаружи) → 80 (внутри)
  - Backend: 8080 (только внутри сети)
- Архитектура: Browser → Nginx (Frontend) → Backend (Go)

### Testing
- ✅ Валидация работает корректно
- ✅ Docker контейнеры собираются и запускаются
- ✅ API проксирование через Nginx функционирует
- ✅ sample.graphml проходит валидацию
