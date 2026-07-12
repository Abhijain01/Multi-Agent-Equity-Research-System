FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir uvicorn fastapi reportlab

# Copy source code
COPY alphaagents/ ./alphaagents/
COPY backend/ ./backend/
COPY .env.example .env.example

# Create cache directory
RUN mkdir -p cache

# HuggingFace Spaces runs on port 7860
EXPOSE 7860

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]