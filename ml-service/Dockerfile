# ─── ML Service (Python / FastAPI) ───────────────────────────────
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Download NLTK vader_lexicon data needed by vaderSentiment
RUN python -c "import nltk; nltk.download('vader_lexicon', quiet=True)" || true
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
