# GoldenHawk AI backend — portable container for Railway / Fly.io / any Docker host.
# (On Render you can skip this and use the render.yaml blueprint instead.)
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hosts inject the port to listen on via $PORT (default 8000 for local runs).
ENV PORT=8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
