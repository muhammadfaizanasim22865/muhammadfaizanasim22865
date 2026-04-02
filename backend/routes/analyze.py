"""
Analyze route: POST /analyze
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.analyzer_service import run_analysis

router = APIRouter()


class AnalyzeRequest(BaseModel):
    code: str


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        result = run_analysis(request.code)
        return result
    except SyntaxError as exc:
        return JSONResponse(status_code=422, content={"error": str(exc)})
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": f"Internal server error: {str(exc)}"},
        )
