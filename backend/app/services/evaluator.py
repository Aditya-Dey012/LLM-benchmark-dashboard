from typing import Optional
import numpy as np

_embedding_model = None


def _get_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def evaluate(prompt: str, response: str, context: Optional[str] = None) -> dict:
    if not response or not response.strip():
        return {
            "relevancy_score": 0.0,
            "faithfulness_score": None,
            "hallucination_rate": None,
            "cosine_score": 0.0,
        }

    try:
        model = _get_model()
        texts = [prompt, response] + ([context] if context else [])
        embeddings = model.encode(texts, normalize_embeddings=True)

        # Relevancy: prompt ↔ response (already normalized, dot product = cosine)
        relevancy = float(np.dot(embeddings[0], embeddings[1]))
        # Map from [-1,1] → [0,1]
        relevancy = (relevancy + 1) / 2

        faithfulness = None
        hallucination_rate = None
        if context:
            faith_raw = float(np.dot(embeddings[2], embeddings[1]))
            faithfulness = (faith_raw + 1) / 2
            hallucination_rate = 1.0 - faithfulness

        return {
            "relevancy_score": round(relevancy, 4),
            "faithfulness_score": round(faithfulness, 4) if faithfulness is not None else None,
            "hallucination_rate": round(hallucination_rate, 4) if hallucination_rate is not None else None,
            "cosine_score": round(relevancy, 4),
        }
    except Exception as exc:
        return {
            "relevancy_score": None,
            "faithfulness_score": None,
            "hallucination_rate": None,
            "cosine_score": None,
            "_eval_error": str(exc),
        }
