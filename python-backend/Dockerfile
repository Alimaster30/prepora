FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001

WORKDIR /app

RUN addgroup --system prepora && adduser --system --ingroup prepora prepora

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    python -m nltk.downloader -d /usr/local/share/nltk_data punkt punkt_tab stopwords

COPY . .
RUN chown -R prepora:prepora /app
USER prepora

EXPOSE 8001
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2"]
