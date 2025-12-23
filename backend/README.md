# GraphML Parser API

Go Gin REST API для парсинга GraphML строк и возврата структурированных данных графа в JSON формате.

## Требования

- Go 1.23.5 или выше

## Установка

1. Убедитесь, что у вас установлена правильная версия Go:
```bash
$HOME/go1.23.5/bin/go version
```

2. Установите зависимости:
```bash
cd backend
$HOME/go1.23.5/bin/go mod tidy
```

## Запуск

```bash
cd backend
$HOME/go1.23.5/bin/go run main.go
```

Сервер запустится на порту 8080.

## API

### POST /parse

Принимает GraphML строку и возвращает JSON с данными графа.

**Request:**
```json
{
  "graphml": "<?xml version=\"1.0\"?>...<graphml>...</graphml>"
}
```

**Response:**
```json
{
  "nodes": [
    {
      "id": "svc_api",
      "label": "API Gateway"
    },
    ...
  ],
  "edges": [
    {
      "id": "e1",
      "label": "login/refresh",
      "source": "svc_api",
      "target": "svc_auth",
      "pair": "svc_api -> svc_auth"
    },
    ...
  ]
}
```

## Пример использования

### С помощью curl:

```bash
# Создаем JSON запрос из GraphML файла
python3 -c "import json; print(json.dumps({'graphml': open('sample.graphml').read()}))" > request.json

# Отправляем запрос
curl -X POST http://localhost:8080/parse \
  -H "Content-Type: application/json" \
  -d @request.json
```

### С помощью Python:

```python
import requests
import json

# Читаем GraphML файл
with open('sample.graphml', 'r') as f:
    graphml_content = f.read()

# Отправляем запрос
response = requests.post(
    'http://localhost:8080/parse',
    json={'graphml': graphml_content}
)

# Получаем результат
graph_data = response.json()
print(f"Nodes: {len(graph_data['nodes'])}")
print(f"Edges: {len(graph_data['edges'])}")
```

## Структура проекта

- `main.go` - основной файл приложения
- `sample.graphml` - пример GraphML файла для тестирования
- `go.mod` - файл зависимостей Go

## Библиотеки

Проект использует:
- [Gin](https://github.com/gin-gonic/gin) v1.11.0 - HTTP веб-фреймворк
- [graphml](https://github.com/freddy33/graphml) v1.0.0 - библиотека для парсинга GraphML файлов
