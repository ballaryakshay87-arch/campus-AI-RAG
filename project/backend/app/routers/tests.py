"""Tests router — GET /api/tests"""

from fastapi import APIRouter
from app.models import TestReportResponse
from app.tests.runner import run_all_tests

router = APIRouter()


@router.get("/api/tests", response_model=TestReportResponse)
async def get_tests():
    report = run_all_tests()
    return TestReportResponse(**report)
