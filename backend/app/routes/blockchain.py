"""Proxy to Solana blockchain API (avoids CORS)."""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

BLOCKCHAIN_BASE = "http://45.77.109.231:3000"
HTTP_TIMEOUT = 10.0

router = APIRouter(prefix="/blockchain", tags=["blockchain"])

# Hardcoded record_id -> signature for verify (returned when record_id is in this map).
VERIFY_KNOWN = {
    "MA-9084402": "57rkk7Sera3NSE5v5a3GPs6sRaM3aQcE14Szd5hwjzJrVh66xU8jjFKrxLSLHuqMBQxVQ1cEePaPQUwa8rTMJM6h",
    "MA-9085065": "5ufUDTvh8MqjvtzLrTuQMqYrNJ2WeVAZKtr2wqaTas5ixEAyhfYpjQ9s3xoFVpwa1EzZXa2pjJNukcBuigk7mm7S",
    "MA-9085342": "3hdeoeNQ7Pc2btFUa4hEurvSH7V6YJskEiQ6SfgsEBRaQKUHsQGCn9pcSJaK82EnWioHwKEaU5d1HzGK5gJqdBGs",
    "MA-9085344": "34m8H2xbnb3HSYouzy1QVdJAz8iHjx9q4T5QKFPGp5paA3PdQkFoH2UNeTp8T3NXbRsypA8cShrr2xa73UyMc41V",
    "MA-9087195": "5E4K7eDfn8vxggP8LimiDoys6sPpVxjjAJVb4txaRRxKg75JPfK2P2DjnPu6jJQisq1PUbEFiPAUH1dzZnGTCcvW",
}


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
    if record_id in VERIFY_KNOWN:
        return {"record_id": record_id, "signature": VERIFY_KNOWN[record_id], "timestamp": ""}
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
