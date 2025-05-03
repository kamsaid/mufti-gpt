"""One-off script to embed & upsert Qur'an and ḥadith texts into Pinecone.

Usage:
    $ python scripts/ingest.py            # full ingest (may take long)
    $ python scripts/ingest.py --sample   # ingest only sample data for dev

Notes:
    Designed to be idempotent; re-running will overwrite existing vectors with
    the same IDs.  To keep the repo small, we store only tiny sample extracts
    under `data/` for CI/test usage.
"""

from __future__ import annotations

import sys
import logging

import argparse
import json
import pathlib
from typing import Iterable, List

# Ensure project root is on PYTHONPATH when running as a script (`python scripts/ingest.py`)
ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from pinecone import Pinecone  # type: ignore
from langchain_openai import OpenAIEmbeddings

from backend.config import get_settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent / "data"


def _load_quran(sample: bool) -> Iterable[tuple[str, str]]:
    """Yield (id, text) tuples for each ayah."""

    import xml.etree.ElementTree as ET

    file_name = "quran_sample.xml" if sample else "quran.xml"
    file_path = DATA_DIR / file_name
    logger.info(f"Attempting to load Qur'an from: {file_path}")
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        logger.info(f"Parsed XML root tag: {root.tag}")
    except ET.ParseError as e:
        logger.error(f"Failed to parse XML file {file_path}: {e}")
        return
    except FileNotFoundError:
        logger.error(f"Qur'an file not found: {file_path}")
        return

    count = 0
    # Iterate through suras first, then ayahs within each sura
    for sura_element in root.findall('sura'):
        sura_index = sura_element.get("index")
        if not sura_index:
            logger.warning(f"Skipping sura element due to missing 'index' attribute: {ET.tostring(sura_element, encoding='unicode')}")
            continue

        for ayah_element in sura_element.findall('aya'):
            try:
                aya_index = ayah_element.get("index")
                arabic_text = ayah_element.get("text")

                # Find the translation tag and get its text
                translation_element = ayah_element.find('translation')
                english_text = translation_element.text if translation_element is not None else ""

                if not all([aya_index, arabic_text, english_text]):
                    missing = [k for k, v in {"index": aya_index, "text": arabic_text, "translation": english_text}.items() if not v]
                    logger.warning(f"Skipping ayah {sura_index}:{aya_index} due to missing parts: {missing}")
                    continue

                if not arabic_text.strip():
                    logger.warning(f"Skipping empty ayah: {sura_index}:{aya_index}")
                    continue

                # Combine Arabic and English for the document content
                full_text = f"{arabic_text}\n{english_text}"
                doc_id = f"quran-{sura_index}:{aya_index}"
                yield doc_id, full_text
                count += 1
            except Exception as e:
                logger.error(f"Error processing ayah {sura_index}:{ayah_element.get('index', 'N/A')}: {e} - {ET.tostring(ayah_element, encoding='unicode')}")

    logger.info(f"Finished loading Qur'an. Yielded {count} ayahs.")


def _load_hadith(sample: bool) -> Iterable[tuple[str, str]]:
    """Yield (id, text) tuples for each hadith."""

    file_name = "ahadith_sample.json" if sample else "ahadith.json"
    file_path = DATA_DIR / file_name
    logger.info(f"Attempting to load Hadith from: {file_path}")
    try:
        with file_path.open("r", encoding="utf-8") as fp:
            data = json.load(fp)
            logger.info(f"Loaded JSON data type: {type(data)}")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON file {file_path}: {e}")
        return
    except FileNotFoundError:
        logger.error(f"Hadith file not found: {file_path}")
        return

    # Access the list under the "hadiths" key
    hadith_list = data.get("hadiths", []) if isinstance(data, dict) else []

    if not isinstance(hadith_list, list):
        logger.error(f"Expected a list under the 'hadiths' key, but found {type(hadith_list)}")
        return

    logger.info(f"Found {len(hadith_list)} potential hadith items in the list.")

    count = 0
    for i, item in enumerate(hadith_list):
        if not isinstance(item, dict):
            logger.warning(f"Skipping invalid hadith item (not a dict) at index {i}: {item}")
            continue

        # Use bookId for collection and idInBook for hadith number
        book_id = item.get('bookId')
        hadith_num = item.get('idInBook') # Use idInBook
        arabic = item.get('arabic')
        english_obj = item.get('english')
        english = english_obj.get('text') if isinstance(english_obj, dict) else None # Get nested text

        if not all([book_id is not None, hadith_num is not None, arabic, english]): # Check book_id existence
            # Log more details about which field might be missing
            missing_fields = [
                k for k, v in {'bookId': book_id, 'idInBook': hadith_num, 'arabic': arabic, 'english.text': english}.items() if v is None or (isinstance(v, str) and not v)
            ]
            logger.warning(f"Skipping hadith item at index {i} (idInBook: {hadith_num or 'N/A'}) due to missing fields: {missing_fields}")
            continue

        # Generate ID using bookId and idInBook
        doc_id = f"hadith-{book_id}-{hadith_num}"
        text = f"{arabic}\n{english}"
        yield doc_id, text
        count += 1

    logger.info(f"Finished loading Hadith. Yielded {count} items.")


def upsert_documents(pairs: Iterable[tuple[str, str]], embed, batch_size: int = 100) -> None:
    """Embed *pairs* in batches and upsert to Pinecone.

    A single `embed.embed_documents()` call handles a list of texts, which is
    **far** more efficient than one-by-one `embed_query` calls (fewer network
    round-trips, better rate-limit utilisation).
    """

    pairs_list = [p for p in pairs if p[1] and not p[1].isspace()]
    logger.info(f"Starting upsert for {len(pairs_list)} pairs...")

    if not pairs_list:
        logger.warning("Received empty list of pairs, nothing to upsert.")
        return

    upserted_total = 0

    for start in range(0, len(pairs_list), batch_size):
        batch = pairs_list[start : start + batch_size]
        ids = [doc_id for doc_id, _ in batch]
        texts = [text for _, text in batch]

        try:
            embeddings = embed.embed_documents(texts)  # one API call per batch
        except Exception as e:
            logger.error(f"Embedding batch starting at {start} failed: {e}")
            continue

        vectors = [
            (ids[i], embeddings[i], {"text": texts[i]}) for i in range(len(ids))
        ]

        try:
            upsert_resp = index.upsert(vectors=vectors)
            upserted_total += getattr(upsert_resp, "upserted_count", 0) or 0
            logger.info(
                f"Upserted batch {start // batch_size + 1} – {len(vectors)} vectors"
            )
        except Exception as e:
            logger.error(f"Pinecone upsert failed for batch {start}: {e}")

    logger.info(
        f"Finished upsert loop. Total vectors reported upserted by Pinecone: {upserted_total}"
    )


# Helper function to recursively extract text from JSON values
def _flatten_json_value(value) -> List[str]:
    """Recursively extracts non-empty string representations from JSON values."""
    parts = []
    if isinstance(value, str):
        cleaned_value = value.strip()
        if cleaned_value: # Add only non-empty strings
            parts.append(cleaned_value)
    elif isinstance(value, (int, float, bool)):
        # Convert numbers and booleans to string
        parts.append(str(value))
    elif isinstance(value, list):
        # Recursively flatten list items
        for item in value:
            parts.extend(_flatten_json_value(item))
    elif isinstance(value, dict):
        # Recursively flatten dictionary values
        for v in value.values():
            parts.extend(_flatten_json_value(v))
    # Implicitly handles None and other types by returning empty list for them
    return parts


def _load_generic_json(file_name: str, prefix: str) -> Iterable[tuple[str, str]]:
    """Yield `(id, text)` pairs from generic JSON structures using recursive flattening.

    Handles:
    1. Root dictionary: Creates one document per key, flattening its value.
    2. Root list: Creates one document per item, flattening the item.
    """

    file_path = DATA_DIR / file_name
    logger.info(f"Attempting to load generic JSON from: {file_path}")

    try:
        with file_path.open("r", encoding="utf-8") as fp:
            data = json.load(fp)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        logger.error(f"Failed to read {file_path}: {e}")
        return

    count = 0
    if isinstance(data, dict):
        # Process root dictionary: one document per key-value pair
        for i, (k, v) in enumerate(data.items(), start=1):
            # Flatten the value (v) recursively
            flattened_parts = _flatten_json_value(v)
            # Combine the key and the flattened value parts
            text = f"{k}\n" + "\n".join(flattened_parts) if flattened_parts else k
            # Only yield if there's meaningful text
            if text.strip():
                doc_id = f"{prefix}-{k}-{i}" # Include key in ID for potential uniqueness
                yield doc_id, text.strip()
                count += 1
            else:
                logger.warning(f"Skipping empty flattened content for key '{k}' in {file_name}")

    elif isinstance(data, list):
        # Process root list: one document per item
        for i, item in enumerate(data, start=1):
            # Flatten the item recursively
            flattened_parts = _flatten_json_value(item)
            # Join the flattened parts to form the document text
            text = "\n".join(flattened_parts)
            # Only yield if there's meaningful text
            if text.strip():
                doc_id = f"{prefix}-{i}"
                yield doc_id, text.strip()
                count += 1
            else:
                logger.warning(f"Skipping empty flattened content for list item {i} in {file_name}")

    else:
        logger.error(f"Unsupported JSON root type in {file_name}: {type(data)}. Expected dict or list.")
        return

    logger.info(f"Finished loading {file_name}. Yielded {count} items.")


# ------------------------------------------------------------------
# Wrapper loaders for newly added files
# ------------------------------------------------------------------

def _load_islamic_facts() -> Iterable[tuple[str, str]]:
    return _load_generic_json("islamic-facts.json", "fact")

def _load_islamic_terms() -> Iterable[tuple[str, str]]:
    return _load_generic_json("islamic-terms.json", "term")

def _load_islamic_laws() -> Iterable[tuple[str, str]]:
    return _load_generic_json("islamic-laws.json", "law")

def _load_islamic_timeline() -> Iterable[tuple[str, str]]:
    return _load_generic_json("islamic-timeline.json", "timeline")

def _load_prophet_muhammad() -> Iterable[tuple[str, str]]:
    return _load_generic_json("prophetmuhammad.json", "seerah")

def _load_prophet_stories() -> Iterable[tuple[str, str]]:
    return _load_generic_json("prophetstories.json", "story")

def _load_allah_names() -> Iterable[tuple[str, str]]:
    return _load_generic_json("Allahnames.json", "asmau")

def _load_qibla() -> Iterable[tuple[str, str]]:
    return _load_generic_json("qibla.json", "qibla")

def _load_quran_stats() -> Iterable[tuple[str, str]]:
    return _load_generic_json("quranstats.json", "qstats")

def _load_road_to_salvation() -> Iterable[tuple[str, str]]:
    return _load_generic_json("roadtosalvation.json", "salvation")

def _load_wudu() -> Iterable[tuple[str, str]]:
    return _load_generic_json("wudu.json", "wudu")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Islamic texts into Pinecone")
    parser.add_argument("--sample", action="store_true", help="ingest only sample dataset")
    args = parser.parse_args()

    logger.info(f"Starting ingestion process... (sample={args.sample})")

    settings = get_settings()

    pc = Pinecone(api_key=settings.PINECONE_API_KEY)

    if settings.PINECONE_INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=1536,
            metric="cosine",
        )

    index = pc.Index(settings.PINECONE_INDEX_NAME)
    # Initialise embeddings with explicit key to avoid env-var lookup issues
    embed = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)

    # Qur'an
    quran_pairs = list(_load_quran(args.sample)) # Materialize generator
    upsert_documents(quran_pairs, embed)
    # Ahadith
    hadith_pairs = list(_load_hadith(args.sample)) # Materialize generator
    upsert_documents(hadith_pairs, embed)

    # ------------------------------------------------------------------
    # Newly added datasets (generic JSON ingestion)
    # ------------------------------------------------------------------

    generic_loaders = [
        _load_islamic_facts,
        _load_islamic_terms,
        _load_islamic_laws,
        _load_islamic_timeline,
        _load_prophet_muhammad,
        _load_prophet_stories,
        _load_allah_names,
        _load_qibla,
        _load_quran_stats,
        _load_road_to_salvation,
        _load_wudu,
    ]

    for loader in generic_loaders:
        pairs = list(loader())
        upsert_documents(pairs, embed)

    print("✅ Ingestion completed.") 