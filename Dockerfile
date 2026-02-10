# ------------------------------
# Stage 1: Build Frontend
# ------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Копируем package.json и package-lock.json для кеширования слоёв
COPY frontend/package*.json ./

RUN npm install

# Копируем исходники фронтенда
COPY frontend/ ./

# Собираем фронтенд
RUN npm run build

# ------------------------------
# Stage 2: Build Backend
# ------------------------------
FROM python:3.11-slim AS backend-build

WORKDIR /app/backend

# Устанавливаем зависимости
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь backend
COPY backend/ ./

# Копируем собранный фронтенд из предыдущего этапа
COPY --from=frontend-build /app/frontend/dist ./static

# ------------------------------
# Stage 3: Run App
# ------------------------------
EXPOSE 8000

# Создаём переменную app для Gunicorn
ENV FLASK_APP=app.py

# Запускаем Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
