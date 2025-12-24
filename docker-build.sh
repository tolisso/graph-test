#!/bin/bash
# Скрипт для проверки сборки Docker образов

set -e

echo "=== Проверка Docker ==="
docker --version
docker-compose --version

echo ""
echo "=== Сборка Backend ==="
docker build -t graph-backend:test ./backend

echo ""
echo "=== Сборка Frontend ==="
docker build -t graph-frontend:test ./my-react-ts-app

echo ""
echo "=== Образы успешно собраны! ==="
docker images | grep graph-

echo ""
echo "=== Запуск через docker-compose ==="
docker-compose up -d

echo ""
echo "=== Статус контейнеров ==="
docker-compose ps

echo ""
echo "=== Фронтенд доступен на http://localhost:3000 ==="
