# GraphML Validation Rules

Backend выполняет валидацию GraphML данных перед обработкой.

## Обязательные поля

### Node (узел)
- `label` (n_label) - название узла
- `type` (n_type) - тип узла

### Edge (ребро)
- `kind` (e_kind) - тип связи
- `criticality` (e_crit) - критичность

## Допустимые значения

### node.type
Допустимые типы узлов:
- `service` - сервис/микросервис
- `db` - база данных
- `cache` - кеш (Redis, Memcached)
- `queue` - очередь сообщений (Kafka, RabbitMQ)
- `external` - внешний сервис

### edge.kind
Допустимые типы связей:
- `sync` - синхронный вызов (HTTP, gRPC)
- `async` - асинхронный вызов (события)
- `stream` - потоковая передача данных

### edge.criticality
Уровни критичности:
- `low` - низкая
- `medium` - средняя
- `high` - высокая

## Дополнительные проверки

1. **Существование узлов**: каждое ребро должно ссылаться на существующие узлы
   - `source` должен указывать на существующий node.id
   - `target` должен указывать на существующий node.id

## Примеры

### ✅ Валидный GraphML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="n_label" for="node" attr.name="label" attr.type="string"/>
  <key id="n_type" for="node" attr.name="type" attr.type="string"/>
  <key id="e_kind" for="edge" attr.name="kind" attr.type="string"/>
  <key id="e_crit" for="edge" attr.name="criticality" attr.type="string"/>

  <graph id="G" edgedefault="directed">
    <node id="svc1">
      <data key="n_label">API Service</data>
      <data key="n_type">service</data>
    </node>

    <node id="db1">
      <data key="n_label">PostgreSQL</data>
      <data key="n_type">db</data>
    </node>

    <edge id="e1" source="svc1" target="db1">
      <data key="e_kind">sync</data>
      <data key="e_crit">high</data>
    </edge>
  </graph>
</graphml>
```

### ❌ Ошибки валидации

**Отсутствует обязательное поле type:**
```xml
<node id="n1">
  <data key="n_label">API Service</data>
  <!-- missing n_type -->
</node>
```
Ошибка: `node 'n1': missing required field 'type'`

**Некорректный тип узла:**
```xml
<node id="n1">
  <data key="n_label">API Service</data>
  <data key="n_type">microservice</data> <!-- invalid type -->
</node>
```
Ошибка: `node 'n1': invalid type 'microservice', must be one of: service, db, cache, queue, external`

**Несуществующий target узел:**
```xml
<edge id="e1" source="n1" target="n999">
  <data key="e_kind">sync</data>
  <data key="e_crit">high</data>
</edge>
```
Ошибка: `edge 'e1': target node 'n999' does not exist`

**Некорректное значение criticality:**
```xml
<edge id="e1" source="n1" target="n2">
  <data key="e_kind">sync</data>
  <data key="e_crit">critical</data> <!-- invalid value -->
</edge>
```
Ошибка: `edge 'e1': invalid criticality 'critical', must be one of: low, medium, high`

## Тестирование валидации

Вы можете протестировать валидацию с помощью curl:

```bash
# Валидный запрос
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"graphml":"<?xml version=\"1.0\"?><graphml xmlns=\"http://graphml.graphdrawing.org/xmlns\">...</graphml>"}'

# Пример с ошибкой валидации
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"graphml":"<?xml version=\"1.0\"?><graphml xmlns=\"http://graphml.graphdrawing.org/xmlns\"><graph><node id=\"n1\"><data key=\"n_label\">Test</data></node></graph></graphml>"}'

# Ответ: {"error":"Failed to parse GraphML: node 'n1': missing required field 'type'"}
```

## Формат ответа

### Успешный ответ (200 OK)
```json
{
  "nodes": [
    {
      "id": "svc1",
      "label": "API Service",
      "type": "service"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "label": "query",
      "source": "svc1",
      "target": "db1",
      "kind": "sync",
      "criticality": "high",
      "pair": "svc1 -> db1"
    }
  ]
}
```

### Ошибка валидации (400 Bad Request)
```json
{
  "error": "Failed to parse GraphML: node 'n1': missing required field 'type'"
}
```
