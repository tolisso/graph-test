# GraphML Parser

Go Gin проект для парсинга GraphML файлов.

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

При запуске приложение:
1. Парсит файл `sample.graphml`
2. Выводит в консоль два массива:
   - Список нод (ID и название)
   - Список рёбер (ID, название и пара вершин, которые они соединяют)
3. Выводит JSON представление данных
4. Запускает Gin веб-сервер на порту 8080

## API Endpoints

После запуска доступны следующие endpoints:

- `GET /` - информация об API
- `GET /graph` - получить весь граф (ноды и рёбра)
- `GET /nodes` - получить только ноды
- `GET /edges` - получить только рёбра

Примеры запросов:
```bash
curl http://localhost:8080/
curl http://localhost:8080/graph
curl http://localhost:8080/nodes
curl http://localhost:8080/edges
```

## Структура проекта

- `main.go` - основной файл приложения
- `sample.graphml` - пример GraphML файла для парсинга
- `go.mod` - файл зависимостей Go

## Пример вывода

При запуске вы увидите:
```
=== NODES ===
Всего нод: 9

1. ID: svc_api, Label: API Gateway
2. ID: svc_auth, Label: Auth Service
...

=== EDGES ===
Всего рёбер: 8

1. ID: e1, Label: login/refresh, Pair: svc_api -> svc_auth
2. ID: e2, Label: create order, Pair: svc_api -> svc_orders
...
```

## Библиотеки

Проект использует:
- [Gin](https://github.com/gin-gonic/gin) v1.11.0 - HTTP веб-фреймворк
- [graphml](https://github.com/freddy33/graphml) v1.0.0 - библиотека для парсинга GraphML файлов
