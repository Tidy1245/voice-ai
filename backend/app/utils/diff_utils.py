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
    """Check if a character can be matched."""
    return not is_punctuation(char) and not is_whitespace(char)


def normalize_with_mapping(text: str, keep_wildcards: bool = False) -> Tuple[str, List[int]]:
    """
    Normalize text and return mapping from normalized positions to original positions.
    """
    if not text:
        return "", []

    result = []
    mapping = []  # mapping[normalized_idx] = original_idx

    for i, char in enumerate(text):
        if keep_wildcards and char == '*':
            result.append(char)
            mapping.append(i)
        elif is_matchable(char):
            result.append(char)
            mapping.append(i)

    return "".join(result), mapping


def get_original_text_with_spacing(original: str, start_orig: int, end_orig: int) -> str:
    """
    Get text from original including any trailing whitespace/punctuation up to next matchable char.
    """
    text = original[start_orig:end_orig]

    # Include trailing whitespace/punctuation
    while end_orig < len(original) and not is_matchable(original[end_orig]):
        text += original[end_orig]
        end_orig += 1

    return text


def match_with_wildcard(
    ref_norm: str,
    trans_norm: str,
    trans_original: str,
    trans_mapping: List[int]
) -> List[Dict[str, str]]:
    """
    Match reference text against transcription and return segments with original spacing.
    """
    result = []
    ref_idx = 0
    trans_idx = 0
    ref_len = len(ref_norm)
    trans_len = len(trans_norm)

    def get_trans_text(start_idx: int, end_idx: int) -> str:
        """Get original transcription text for normalized range."""
        if start_idx >= len(trans_mapping) or end_idx <= 0:
            return ""

        start_orig = trans_mapping[start_idx]
        if end_idx >= len(trans_mapping):
            end_orig = len(trans_original)
        else:
            end_orig = trans_mapping[end_idx]

        return trans_original[start_orig:end_orig]

    while ref_idx < ref_len or trans_idx < trans_len:
        if ref_idx >= ref_len:
            # Reference exhausted, remaining transcription is extra
            text = get_trans_text(trans_idx, trans_len)
            if text:
                result.append({"type": "insert", "text": text})
            break

        if trans_idx >= trans_len:
            # Transcription exhausted, remaining reference is missing
            remaining = ref_norm[ref_idx:].replace('*', '')
            if remaining:
                result.append({"type": "delete", "text": remaining})
            break

        ref_char = ref_norm[ref_idx]

        if ref_char == '*':
            # Wildcard matching
            next_ref_idx = ref_idx + 1
            while next_ref_idx < ref_len and ref_norm[next_ref_idx] == '*':
                next_ref_idx += 1

            if next_ref_idx >= ref_len:
                # Wildcard at end - matches rest of transcription
                text = get_trans_text(trans_idx, trans_len)
                if text:
                    result.append({"type": "equal", "text": text})
                break
            else:
                next_ref_char = ref_norm[next_ref_idx]
                found_idx = -1
                for i in range(trans_idx, trans_len):
                    if trans_norm[i] == next_ref_char:
                        found_idx = i
                        break

                if found_idx == -1:
                    text = get_trans_text(trans_idx, trans_len)
                    if text:
                        result.append({"type": "equal", "text": text})
                    ref_idx = next_ref_idx
                    trans_idx = trans_len
                elif found_idx == trans_idx:
                    ref_idx = next_ref_idx
                else:
                    text = get_trans_text(trans_idx, found_idx)
                    if text:
                        result.append({"type": "equal", "text": text})
                    ref_idx = next_ref_idx
                    trans_idx = found_idx
        else:
            trans_char = trans_norm[trans_idx]

            if ref_char == trans_char:
                text = get_trans_text(trans_idx, trans_idx + 1)
                if text:
                    result.append({"type": "equal", "text": text})
                ref_idx += 1
                trans_idx += 1
            else:
                # Find best alignment
                ref_found_in_trans = -1
                for i in range(trans_idx, min(trans_idx + 10, trans_len)):
                    if trans_norm[i] == ref_char:
                        ref_found_in_trans = i
                        break

                trans_found_in_ref = -1
                for i in range(ref_idx, min(ref_idx + 10, ref_len)):
                    if ref_norm[i] == '*':
                        continue
                    if ref_norm[i] == trans_char:
                        trans_found_in_ref = i
                        break

                if ref_found_in_trans != -1 and (trans_found_in_ref == -1 or ref_found_in_trans - trans_idx <= trans_found_in_ref - ref_idx):
                    # Extra characters in transcription
                    text = get_trans_text(trans_idx, ref_found_in_trans)
                    if text:
                        result.append({"type": "insert", "text": text})
                    trans_idx = ref_found_in_trans
                elif trans_found_in_ref != -1:
                    # Missing characters from transcription
                    missing = ""
                    for i in range(ref_idx, trans_found_in_ref):
                        if ref_norm[i] != '*':
                            missing += ref_norm[i]
                    if missing:
                        result.append({"type": "delete", "text": missing})
                    ref_idx = trans_found_in_ref
                else:
                    # No good alignment found
                    result.append({"type": "delete", "text": ref_char})
                    text = get_trans_text(trans_idx, trans_idx + 1)
                    if text:
                        result.append({"type": "insert", "text": text})
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
    - Output preserves original transcription formatting (spaces, etc.)

    Returns a list of diff segments:
    - type='equal': correctly matched (green)
    - type='delete': missing from transcription (red)
    - type='insert': extra in transcription (red)
    """
    if not reference or not transcription:
        return []

    # Normalize texts with position mapping
    ref_norm, _ = normalize_with_mapping(reference, keep_wildcards=True)
    trans_norm, trans_mapping = normalize_with_mapping(transcription, keep_wildcards=False)

    if not ref_norm and not trans_norm:
        return []

    if not ref_norm:
        return [{"type": "insert", "text": transcription}]

    if not trans_norm:
        ref_no_wildcard = ref_norm.replace('*', '')
        if ref_no_wildcard:
            return [{"type": "delete", "text": ref_no_wildcard}]
        return []

    return match_with_wildcard(ref_norm, trans_norm, transcription, trans_mapping)
