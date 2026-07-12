"""
backend/store.py
In-memory store for research notes and eval scores.
Keyed by note_id (UUID). Resets on server restart — fine for demo/internship.
"""

from typing import Dict, Any

# Main note store: {note_id: NoteData dict}
note_store: Dict[str, Dict[str, Any]] = {}

# Eval scores store: {note_id: EvalScores dict}
eval_store: Dict[str, Dict[str, Any]] = {}


def save_note(note_id: str, data: dict) -> None:
    note_store[note_id] = data


def get_note(note_id: str) -> dict | None:
    return note_store.get(note_id)


def get_all_notes() -> list[dict]:
    return list(reversed(list(note_store.values())))


def update_note(note_id: str, updates: dict) -> None:
    if note_id in note_store:
        note_store[note_id].update(updates)


def save_eval(note_id: str, scores: dict) -> None:
    eval_store[note_id] = scores


def get_eval(note_id: str) -> dict | None:
    return eval_store.get(note_id)