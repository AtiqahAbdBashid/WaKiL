from google import genai
from google.genai import types
from app.config import GEMINI_API_KEY, GEMINI_MODEL, EMBEDDING_MODEL
from app.prompts import SYSTEM_PROMPT, CATEGORIES, CLASSIFICATION_PROMPT
from app.schemas import ComplaintDraft, Classification

client = genai.Client(api_key=GEMINI_API_KEY)


def call_gemini(contents: list) -> str:

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
        ),
    )
    return response.text


def extract_draft(contents: list) -> ComplaintDraft:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction="Extract the complaint details from the conversation. Use null for anything not mentioned.",
            response_mime_type="application/json",
            response_schema=ComplaintDraft,
        ),
    )
    return ComplaintDraft.model_validate_json(response.text)


def classify(contents: list) -> Classification:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=CLASSIFICATION_PROMPT,
            response_mime_type="application/json",
            response_schema=Classification,
        ),
    )
    return Classification.model_validate_json(response.text)


def embed_texts(texts: list[str]) -> list[list[float]]:
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
    )
    return [e.values for e in response.embeddings]
