import re
import unicodedata
from typing import List, Dict, Tuple


def is_chinese_char(char: str) -> bool:
    """Check if a character is a Chinese character."""
    if len(char) != 1:
        return False
    cp = ord(char)
    return (
        (0x4E00 <= cp <= 0x9FFF) or
        (0x3400 <= cp <= 0x4DBF) or
        (0xF900 <= cp <= 0xFAFF) or
        (0x20000 <= cp <= 0x2A6DF)
    )


def is_punctuation(char: str) -> bool:
    """Check if a character is punctuation."""
    if len(char) != 1:
        return False
    category = unicodedata.category(char)
    return category.startswith('P')


def is_whitespace(char: str) -> bool:
    """Check if a character is whitespace."""
    return char in ' \t\n\r'


def is_matchable(char: str) -> bool:
    """Check if a character can be matched by wildcard."""
    return not is_punctuation(char) and not is_whitespace(char)


def normalize_text(text: str, keep_wildcards: bool = False) -> str:
    """
    Normalize text for comparison:
    - Remove all punctuation (except * if keep_wildcards)
    - Remove newlines and whitespace
    """
    if not text:
        return ""

    result = []
    for char in text:
        if keep_wildcards and char == '*':
            result.append(char)
        elif is_matchable(char):
            result.append(char)

    return "".join(result)


def match_with_wildcard(reference: str, transcription: str) -> List[Dict[str, str]]:
    """
    Match reference text (with wildcards) against transcription.
    '*' in reference matches one or more non-punctuation, non-whitespace characters.

    Returns list of segments:
    - type='equal': matched characters (shown in green)
    - type='delete': missing characters from transcription (shown in red)
    - type='insert': extra characters in transcription (shown in red)
    """
    result = []
    ref_idx = 0
    trans_idx = 0
    ref_len = len(reference)
    trans_len = len(transcription)

    while ref_idx < ref_len or trans_idx < trans_len:
        if ref_idx >= ref_len:
            # Reference exhausted, remaining transcription is extra
            result.append({"type": "insert", "text": transcription[trans_idx:]})
            break

        if trans_idx >= trans_len:
            # Transcription exhausted, remaining reference is missing
            remaining = reference[ref_idx:].replace('*', '')
            if remaining:
                result.append({"type": "delete", "text": remaining})
            break

        ref_char = reference[ref_idx]

        if ref_char == '*':
            # Wildcard matching
            # Look ahead to find next non-wildcard character in reference
            next_ref_idx = ref_idx + 1
            while next_ref_idx < ref_len and reference[next_ref_idx] == '*':
                next_ref_idx += 1

            if next_ref_idx >= ref_len:
                # Wildcard at end - matches rest of transcription
                result.append({"type": "equal", "text": transcription[trans_idx:]})
                break
            else:
                # Find the next reference character in transcription
                next_ref_char = reference[next_ref_idx]

                # Find where next_ref_char appears in remaining transcription
                found_idx = -1
                for i in range(trans_idx, trans_len):
                    if transcription[i] == next_ref_char:
                        found_idx = i
                        break

                if found_idx == -1:
                    # Next char not found, wildcard matches rest
                    result.append({"type": "equal", "text": transcription[trans_idx:]})
                    ref_idx = next_ref_idx
                    trans_idx = trans_len
                elif found_idx == trans_idx:
                    # Wildcard matches nothing (empty match)
                    ref_idx = next_ref_idx
                else:
                    # Wildcard matches characters up to found_idx
                    result.append({"type": "equal", "text": transcription[trans_idx:found_idx]})
                    ref_idx = next_ref_idx
                    trans_idx = found_idx
        else:
            trans_char = transcription[trans_idx]

            if ref_char == trans_char:
                # Characters match
                result.append({"type": "equal", "text": ref_char})
                ref_idx += 1
                trans_idx += 1
            else:
                # Characters don't match - find best alignment
                # Look ahead to see if we can find ref_char in transcription
                ref_found_in_trans = -1
                for i in range(trans_idx, min(trans_idx + 10, trans_len)):
                    if transcription[i] == ref_char:
                        ref_found_in_trans = i
                        break

                # Look ahead to see if we can find trans_char in reference
                trans_found_in_ref = -1
                for i in range(ref_idx, min(ref_idx + 10, ref_len)):
                    if reference[i] == '*':
                        continue
                    if reference[i] == trans_char:
                        trans_found_in_ref = i
                        break

                if ref_found_in_trans != -1 and (trans_found_in_ref == -1 or ref_found_in_trans - trans_idx <= trans_found_in_ref - ref_idx):
                    # Extra characters in transcription
                    result.append({"type": "insert", "text": transcription[trans_idx:ref_found_in_trans]})
                    trans_idx = ref_found_in_trans
                elif trans_found_in_ref != -1:
                    # Missing characters from transcription
                    missing = ""
                    for i in range(ref_idx, trans_found_in_ref):
                        if reference[i] != '*':
                            missing += reference[i]
                    if missing:
                        result.append({"type": "delete", "text": missing})
                    ref_idx = trans_found_in_ref
                else:
                    # No good alignment found, mark both as different
                    result.append({"type": "delete", "text": ref_char})
                    result.append({"type": "insert", "text": trans_char})
                    ref_idx += 1
                    trans_idx += 1

    # Merge consecutive segments of the same type
    merged = []
    for segment in result:
        if not segment["text"]:
            continue
        if merged and merged[-1]["type"] == segment["type"]:
            merged[-1]["text"] += segment["text"]
        else:
            merged.append(segment)

    return merged


def compute_diff(reference: str, transcription: str) -> List[Dict[str, str]]:
    """
    Compute the difference between reference text and transcription.

    Features:
    - '*' in reference matches one or more characters (not punctuation/whitespace)
    - Punctuation and whitespace are ignored in comparison

    Returns a list of diff segments:
    - type='equal': correctly matched (green)
    - type='delete': missing from transcription (red)
    - type='insert': extra in transcription (red)
    """
    if not reference or not transcription:
        return []

    # Normalize texts (keep wildcards in reference)
    ref_normalized = normalize_text(reference, keep_wildcards=True)
    trans_normalized = normalize_text(transcription, keep_wildcards=False)

    if not ref_normalized and not trans_normalized:
        return []

    if not ref_normalized:
        return [{"type": "insert", "text": trans_normalized}]

    if not trans_normalized:
        ref_no_wildcard = ref_normalized.replace('*', '')
        if ref_no_wildcard:
            return [{"type": "delete", "text": ref_no_wildcard}]
        return []

    return match_with_wildcard(ref_normalized, trans_normalized)
