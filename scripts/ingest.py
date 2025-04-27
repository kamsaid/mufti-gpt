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

from pinecone import Pinecone, ServerlessSpec  # type: ignore
from langchain.embeddings.openai import OpenAIEmbeddings

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


def upsert_documents(pairs: Iterable[tuple[str, str]], embed) -> None:
    """Batch embed and upsert to Pinecone."""

    # Convert iterable to list to check length and prevent exhaustion
    pairs_list = list(pairs)
    logger.info(f"Starting upsert for {len(pairs_list)} pairs...")

    if not pairs_list:
        logger.warning("Received empty list of pairs, nothing to upsert.")
        return

    vectors: List[tuple[str, list[float], dict]] = []
    upserted_count = 0

    for doc_id, text in pairs_list: # Iterate over the list
        emb = embed.embed_query(text)
        vectors.append((doc_id, emb, {"text": text}))

        # upsert in batches of 100 to keep memory low
        if len(vectors) >= 100:
            logger.info(f"Upserting batch of {len(vectors)} vectors...")
            try:
                upsert_response = index.upsert(vectors=vectors)
                logger.info(f"Pinecone upsert response (batch): {upsert_response}")
                upserted_count += upsert_response.upserted_count
            except Exception as e:
                logger.error(f"Error during Pinecone batch upsert: {e}")
            vectors.clear()

    if vectors:
        logger.info(f"Upserting final batch of {len(vectors)} vectors...")
        try:
            upsert_response = index.upsert(vectors=vectors)
            logger.info(f"Pinecone upsert response (final): {upsert_response}")
            upserted_count += upsert_response.upserted_count
        except Exception as e:
            logger.error(f"Error during Pinecone final upsert: {e}")

    logger.info(f"Finished upsert loop. Total vectors reported upserted by Pinecone: {upserted_count}")


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
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

    index = pc.Index(settings.PINECONE_INDEX_NAME)
    embed = OpenAIEmbeddings()

    # Qur'an
    quran_pairs = list(_load_quran(args.sample)) # Materialize generator
    upsert_documents(quran_pairs, embed)
    # Ahadith
    hadith_pairs = list(_load_hadith(args.sample)) # Materialize generator
    upsert_documents(hadith_pairs, embed)

    print("✅ Ingestion completed.") 