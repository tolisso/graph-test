#!/bin/bash

# GraphML Visualizer - Shutdown Script
# Останавливает бэкенд и фронтенд

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

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GraphML Visualizer - Stopping...   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

STOPPED=0

# Останавливаем Backend
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    echo -e "${BLUE}[1/2] Остановка Backend (PID: $BACKEND_PID)...${NC}"

    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null

        # Ждём, пока процесс завершится
        for i in {1..5}; do
            if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done

        # Если процесс всё ещё запущен, убиваем принудительно
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi

        echo -e "${GREEN}✓ Backend остановлен${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend процесс не найден (возможно, уже остановлен)${NC}"
    fi

    rm -f "$BACKEND_PID_FILE"
    STOPPED=1
else
    echo -e "${YELLOW}⚠️  Backend PID файл не найден${NC}"
fi

# Останавливаем Frontend
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    echo -e "${BLUE}[2/2] Остановка Frontend (PID: $FRONTEND_PID)...${NC}"

    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        # Находим все дочерние процессы (Vite запускает несколько процессов)
        CHILD_PIDS=$(pgrep -P $FRONTEND_PID 2>/dev/null || true)

        # Убиваем основной процесс
        kill $FRONTEND_PID 2>/dev/null

        # Убиваем дочерние процессы
        if [ -n "$CHILD_PIDS" ]; then
            echo $CHILD_PIDS | xargs kill 2>/dev/null || true
        fi

        # Ждём, пока процессы завершатся
        for i in {1..5}; do
            if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done

        # Если процесс всё ещё запущен, убиваем принудительно
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
            if [ -n "$CHILD_PIDS" ]; then
                echo $CHILD_PIDS | xargs kill -9 2>/dev/null || true
            fi
        fi

        echo -e "${GREEN}✓ Frontend остановлен${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend процесс не найден (возможно, уже остановлен)${NC}"
    fi

    rm -f "$FRONTEND_PID_FILE"
    STOPPED=1
else
    echo -e "${YELLOW}⚠️  Frontend PID файл не найден${NC}"
fi

# Дополнительная очистка: убиваем все процессы на портах 8080 и 5173
echo ""
echo -e "${BLUE}Проверка портов...${NC}"

# Проверяем порт 8080 (Backend)
BACKEND_PORT_PID=$(lsof -ti:8080 2>/dev/null || true)
if [ -n "$BACKEND_PORT_PID" ]; then
    echo -e "${YELLOW}⚠️  Найден процесс на порту 8080 (PID: $BACKEND_PORT_PID)${NC}"
    kill -9 $BACKEND_PORT_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Порт 8080 освобождён${NC}"
fi

# Проверяем порт 5173 (Frontend)
FRONTEND_PORT_PID=$(lsof -ti:5173 2>/dev/null || true)
if [ -n "$FRONTEND_PORT_PID" ]; then
    echo -e "${YELLOW}⚠️  Найден процесс на порту 5173 (PID: $FRONTEND_PORT_PID)${NC}"
    kill -9 $FRONTEND_PORT_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Порт 5173 освобождён${NC}"
fi

echo ""
if [ $STOPPED -eq 1 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      ✓ Все сервисы остановлены!      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   Сервисы не были запущены           ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════╝${NC}"
fi
echo ""
