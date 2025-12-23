#!/bin/bash

# GraphML Visualizer - Startup Script
# Запускает бэкенд (Go) и фронтенд (React + Vite)

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Файлы для хранения PID
BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

# Директория проекта
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/my-react-ts-app"

# Go binary path
GO_BIN="${HOME}/go1.23.5/bin/go"

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GraphML Visualizer - Starting...   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Проверяем, не запущены ли уже сервисы
if [ -f "$BACKEND_PID_FILE" ] || [ -f "$FRONTEND_PID_FILE" ]; then
    echo -e "${YELLOW}⚠️  Возможно, сервисы уже запущены.${NC}"
    echo -e "${YELLOW}   Запустите ./stop.sh перед повторным запуском.${NC}"
    exit 1
fi

# Проверяем наличие Go
if [ ! -f "$GO_BIN" ]; then
    echo -e "${RED}✗ Go не найден по пути: $GO_BIN${NC}"
    echo -e "${RED}  Установите Go или обновите путь в скрипте${NC}"
    exit 1
fi

# Проверяем наличие директорий
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}✗ Backend директория не найдена: $BACKEND_DIR${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}✗ Frontend директория не найдена: $FRONTEND_DIR${NC}"
    exit 1
fi

# Запускаем Backend
echo -e "${BLUE}[1/2] Запуск Backend (Go)...${NC}"
cd "$BACKEND_DIR"

# Запускаем Go сервер в фоне и перенаправляем вывод в лог
nohup $GO_BIN run main.go > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_DIR/$BACKEND_PID_FILE"

# Ждём, пока бэкенд запустится
sleep 2

# Проверяем, что процесс всё ещё запущен
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}✗ Backend не запустился. Проверьте backend/backend.log${NC}"
    rm -f "$PROJECT_DIR/$BACKEND_PID_FILE"
    exit 1
fi

echo -e "${GREEN}✓ Backend запущен (PID: $BACKEND_PID)${NC}"
echo -e "  Логи: backend/backend.log"
echo -e "  URL: http://localhost:8080"
echo ""

# Запускаем Frontend
echo -e "${BLUE}[2/2] Запуск Frontend (React + Vite)...${NC}"
cd "$FRONTEND_DIR"

# Проверяем наличие node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules не найдены. Установка зависимостей...${NC}"
    npm install
fi

# Запускаем Vite dev server в фоне
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_DIR/$FRONTEND_PID_FILE"

# Ждём, пока фронтенд запустится
sleep 3

# Проверяем, что процесс всё ещё запущен
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}✗ Frontend не запустился. Проверьте my-react-ts-app/frontend.log${NC}"
    rm -f "$PROJECT_DIR/$FRONTEND_PID_FILE"
    # Останавливаем бэкенд
    kill $BACKEND_PID 2>/dev/null
    rm -f "$PROJECT_DIR/$BACKEND_PID_FILE"
    exit 1
fi

echo -e "${GREEN}✓ Frontend запущен (PID: $FRONTEND_PID)${NC}"
echo -e "  Логи: my-react-ts-app/frontend.log"
echo -e "  URL: http://localhost:5173"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✓ Все сервисы запущены!         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Открыть приложение:${NC}"
echo -e "  ${GREEN}http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}Просмотр логов:${NC}"
echo -e "  Backend:  tail -f backend/backend.log"
echo -e "  Frontend: tail -f my-react-ts-app/frontend.log"
echo ""
echo -e "${BLUE}Остановка:${NC}"
echo -e "  ./stop.sh"
echo ""
