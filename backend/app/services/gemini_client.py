import base64
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception
from google import genai
from google.genai import types
from google.genai.errors import ClientError
from app.config import GEMINI_API_KEY, GEMINI_MODEL, EMBEDDING_MODEL
from app.prompts import SYSTEM_PROMPT, CATEGORIES, CLASSIFICATION_PROMPT
from app.schemas import ComplaintDraft, Classification

client = genai.Client(api_key=GEMINI_API_KEY)


def is_retryable_error(exc: BaseException) -> bool:
    if isinstance(exc, ClientError):
        err_str = str(exc).lower()
        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
            return True
    return False


retry_gemini = retry(
    retry=retry_if_exception(is_retryable_error),
    wait=wait_random_exponential(min=1, max=5),
    stop=stop_after_attempt(3),
    reraise=True,
)


def make_image_part(image_data_uri: str | None) -> types.Part | None:
    if not image_data_uri or not isinstance(image_data_uri, str):
        return None
    try:
        if "," in image_data_uri:
            header, b64_str = image_data_uri.split(",", 1)
            mime = "image/jpeg"
            if ";" in header and "data:" in header:
                mime = header.split(";")[0].replace("data:", "").strip()
        else:
            mime = "image/jpeg"
            b64_str = image_data_uri
        image_bytes = base64.b64decode(b64_str)
        return types.Part.from_bytes(data=image_bytes, mime_type=mime)
    except Exception as e:
        print(f"Error parsing image part: {e}")
        return None


@retry_gemini
def call_gemini(contents: list) -> str:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
        ),
    )
    return response.text


@retry_gemini
def extract_draft(contents: list) -> ComplaintDraft:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=(
                "Extract the complaint details from the conversation. Use null for anything not mentioned. "
                "CRITICAL: For location, if geographic coordinates or latitude and longitude are provided "
                "(e.g., 'Taman Mawar (3.12050, 101.67020)' or '(lat, long)'), ALWAYS preserve both the location "
                "name and the exact coordinates in the format 'Place Name (latitude, longitude)'."
            ),
            response_mime_type="application/json",
            response_schema=ComplaintDraft,
        ),
    )
    return ComplaintDraft.model_validate_json(response.text)


@retry_gemini
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


@retry_gemini
def embed_texts(texts: list[str]) -> list[list[float]]:
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
    )
    return [e.values for e in response.embeddings]
