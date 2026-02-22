"""Proxy to Solana blockchain API (avoids CORS)."""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

BLOCKCHAIN_BASE = "http://45.77.109.231:3000"
HTTP_TIMEOUT = 10.0

router = APIRouter(prefix="/blockchain", tags=["blockchain"])


async def _get(path: str, error_detail: str = "Request failed"):
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r = await client.get(f"{BLOCKCHAIN_BASE}{path}")
        if r.status_code != 200:
            try:
                err = r.json()
                msg = err.get("error") or err.get("message") or r.text
            except Exception:
                msg = r.text or error_detail
            raise HTTPException(status_code=r.status_code, detail=msg)
        return r.json()


@router.get("/verify/{record_id}")
async def verify_record(record_id: str):
    return await _get(f"/verify/{record_id}", "Verify failed")


@router.get("/fund-status")
async def fund_status():
    return await _get("/fund-status", "Fund status failed")


class LogRecordBody(BaseModel):
    record_id: str
    data: dict


@router.post("/log-record")
async def log_record(body: LogRecordBody):
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r = await client.post(
            f"{BLOCKCHAIN_BASE}/log-record",
            json={"record_id": body.record_id, "data": body.data},
        )
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text or "Log failed")
        return r.json() if r.content else {}
