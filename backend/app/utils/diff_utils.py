from difflib import SequenceMatcher
from typing import List, Dict


def compute_diff(reference: str, transcription: str) -> List[Dict[str, str]]:
    """
    Compute the difference between reference text and transcription.
    Returns a list of diff segments with type ('equal', 'insert', 'delete') and text.
    """
    if not reference or not transcription:
        return []

    # Normalize texts
    ref_normalized = reference.strip()
    trans_normalized = transcription.strip()

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
