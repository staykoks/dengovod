#################################
# 1️⃣ Frontend build
#################################
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build


#################################
# 2️⃣ Backend
#################################
FROM python:3.11-slim

WORKDIR /app

# python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# backend code
COPY backend .

# copy frontend build
COPY --from=frontend-build /app/frontend/dist ./static

# expose
EXPOSE 8000

CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
