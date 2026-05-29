FROM python:3.12-slim

WORKDIR /app

# Системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Зависимости Python (кэшируются отдельно от кода)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Исходный код
COPY src/ ./src/

# Запуск (uvicorn слушает на 8000)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
