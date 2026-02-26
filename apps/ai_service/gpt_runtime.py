import os
import requests
import time
from dotenv import load_dotenv
import logging
logger = logging.getLogger(__name__)

class GPTRunTime:
    def __init__(self):
        load_dotenv()
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OPENAI_API_KEY is not set!")
        self.url = "https://telkom-ai-dag.api.apilogy.id/dummy_api/0.0.0-llm-dummy/v1/llm/chat/completions"
        self.model = "llm_mini_max"

    def generate_response(self, system_prompt: str, user_prompt: str):
        if not self.api_key:
            logger.error("Cannot generate response: OPENAI_API_KEY is missing")
            return ""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_completion_tokens": 1000, # Reduced from 10000 for speed
            "stream": False
        }

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }

        max_retries = 2 # Reduced from 5
        delay_seconds = 2 # Reduced from 5

        for attempt in range(1, max_retries + 1):
            try:
                # Reduced timeout to 15s per request to avoid blocking
                response = requests.post(self.url, headers=headers, json=payload, timeout=15)

                if response.status_code == 200:
                    data = response.json()
                    if data and "choices" in data:
                        content = data["choices"][0]["message"]["content"].strip()
                        return content
                    else:
                        logger.error("Tidak ada respons dari AI.")
                        return ""
                else:
                    logger.error(f"Request gagal (status {response.status_code}). Percobaan ke-{attempt}/{max_retries}.")
                    logger.error(response.text)

            except requests.exceptions.RequestException as e:
                logger.error(f"Error saat request (percobaan ke-{attempt}/{max_retries}): {e}")

            if attempt < max_retries:
                logger.info(f"⏳ Menunggu {delay_seconds} detik sebelum mencoba lagi...")
                time.sleep(delay_seconds)

        logger.error("❌ Gagal mendapatkan respons setelah percobaan.")
        return ""

