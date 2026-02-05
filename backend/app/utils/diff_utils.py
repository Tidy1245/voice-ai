import re
import unicodedata
from difflib import SequenceMatcher
from typing import List, Dict


def is_chinese_char(char: str) -> bool:
    """Check if a character is a Chinese character."""
    if len(char) != 1:
        return False
    cp = ord(char)
    # CJK Unified Ideographs and common ranges
    return (
        (0x4E00 <= cp <= 0x9FFF) or  # CJK Unified Ideographs
        (0x3400 <= cp <= 0x4DBF) or  # CJK Unified Ideographs Extension A
        (0xF900 <= cp <= 0xFAFF) or  # CJK Compatibility Ideographs
        (0x20000 <= cp <= 0x2A6DF)   # CJK Unified Ideographs Extension B
    )


def is_punctuation(char: str) -> bool:
    """Check if a character is punctuation."""
    if len(char) != 1:
        return False
    # Unicode category starting with 'P' is punctuation
    category = unicodedata.category(char)
    return category.startswith('P')


def normalize_text(text: str) -> str:
    """
    Normalize text for comparison:
    - Remove all punctuation
    - Remove newlines
    - Remove spaces between Chinese characters
    - Normalize multiple spaces to single space for English
    """
    if not text:
        return ""

    # Remove punctuation
    result = []
    for char in text:
        if not is_punctuation(char):
            result.append(char)
    text = "".join(result)

    # Replace newlines and tabs with spaces
    text = re.sub(r'[\n\r\t]+', ' ', text)

    # Process character by character to handle Chinese/English spacing
    normalized = []
    prev_char = None

    for char in text:
        if char == ' ':
            # Handle space
            if prev_char is None:
                # Skip leading space
                continue
            elif is_chinese_char(prev_char):
                # Skip space after Chinese character
                continue
            elif normalized and normalized[-1] == ' ':
                # Skip consecutive spaces
                continue
            else:
                # Keep single space for English
                normalized.append(' ')
        else:
            if prev_char == ' ' and is_chinese_char(char):
                # Remove space before Chinese character
                if normalized and normalized[-1] == ' ':
                    normalized.pop()
            normalized.append(char)

        if char != ' ':
            prev_char = char

    # Remove trailing space
    while normalized and normalized[-1] == ' ':
        normalized.pop()

    return "".join(normalized)


def compute_diff(reference: str, transcription: str) -> List[Dict[str, str]]:
    """
    Compute the difference between reference text and transcription.
    Returns a list of diff segments with type ('equal', 'insert', 'delete') and text.

    Comparison rules:
    - Punctuation is ignored
    - Newlines are ignored
    - Spaces between Chinese characters are ignored
    - Multiple spaces between English words are treated as single space
    """
    if not reference or not transcription:
        return []

    # Normalize texts for comparison
    ref_normalized = normalize_text(reference)
    trans_normalized = normalize_text(transcription)

    if not ref_normalized and not trans_normalized:
        return []

    # Use SequenceMatcher to find differences
    matcher = SequenceMatcher(None, ref_normalized, trans_normalized)

    result = []
    for opcode, i1, i2, j1, j2 in matcher.get_opcodes():
        if opcode == "equal":
            result.append({"type": "equal", "text": ref_normalized[i1:i2]})
        elif opcode == "delete":
            result.append({"type": "delete", "text": ref_normalized[i1:i2]})
        elif opcode == "insert":
            result.append({"type": "insert", "text": trans_normalized[j1:j2]})
        elif opcode == "replace":
            result.append({"type": "delete", "text": ref_normalized[i1:i2]})
            result.append({"type": "insert", "text": trans_normalized[j1:j2]})

    # Merge consecutive segments of the same type
    merged = []
    for segment in result:
        if merged and merged[-1]["type"] == segment["type"]:
            merged[-1]["text"] += segment["text"]
        else:
            merged.append(segment)

    return merged
