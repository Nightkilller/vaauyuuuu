"""
VaayuLens AI — FastAPI Application Entrypoint

Main application with CORS configuration, router registration,
and health check endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import FRONTEND_URLS, DATA_MODE
from api.routes_wards import router as wards_router
from api.routes_forecast import router as forecast_router
from api.routes_attribution import router as attribution_router
from api.routes_priority import router as priority_router
from api.routes_advisory import router as advisory_router

# ── App Setup ──────────────────────────────────────────────────────────
app = FastAPI(
    title="VaayuLens AI",
    description="Hyperlocal Urban Air Quality Intelligence API for Delhi, Mumbai, and Bengaluru",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────
app.include_router(wards_router, prefix="/api", tags=["Wards"])
app.include_router(forecast_router, prefix="/api", tags=["Forecast"])
app.include_router(attribution_router, prefix="/api", tags=["Attribution"])
app.include_router(priority_router, prefix="/api", tags=["Priority"])
app.include_router(advisory_router, prefix="/api", tags=["Advisory"])


# ── Health Check ───────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "VaayuLens AI API",
        "data_mode": DATA_MODE,
    }
