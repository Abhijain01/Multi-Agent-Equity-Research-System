"""
backend/models.py
Pydantic models for all FastAPI request and response bodies.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ResearchRequest(BaseModel):
    query: str


class RevisionRequest(BaseModel):
    note_id: str
    feedback: str


class ApprovalRequest(BaseModel):
    note_id: str


class ComparisonRequest(BaseModel):
    query1: str
    query2: str


class EvalRequest(BaseModel):
    note_id: str


class NoteData(BaseModel):
    id: str
    query: str
    company: str
    ticker: str
    note: str
    needs_review: bool
    critique: str
    revision_count: int
    approved: bool = False
    created_at: str


class EvalScores(BaseModel):
    note_id: str
    factuality: float
    completeness: float
    actionability: float
    overall: float
    reasoning: str