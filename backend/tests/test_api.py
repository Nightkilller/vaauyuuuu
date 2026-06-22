"""
VaayuLens AI — API Tests
Basic integration tests for all API endpoints.
"""

import sys
import os

# Add parent directory to path so we can import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✓ Health check endpoint passed")

def test_get_wards():
    # All wards
    response = client.get("/api/wards")
    assert response.status_code == 200
    data = response.json()
    assert "wards" in data
    assert len(data["wards"]) == 18
    
    # Delhi wards
    response_delhi = client.get("/api/wards?city=Delhi")
    assert response_delhi.status_code == 200
    wards_delhi = response_delhi.json()["wards"]
    assert len(wards_delhi) == 6
    assert all(w["city"] == "Delhi" for w in wards_delhi)
    
    # Mumbai wards
    response_mumbai = client.get("/api/wards?city=Mumbai")
    assert response_mumbai.status_code == 200
    wards_mumbai = response_mumbai.json()["wards"]
    assert len(wards_mumbai) == 6
    assert all(w["city"] == "Mumbai" for w in wards_mumbai)
    
    # Bengaluru wards
    response_blr = client.get("/api/wards?city=Bengaluru")
    assert response_blr.status_code == 200
    wards_blr = response_blr.json()["wards"]
    assert len(wards_blr) == 6
    assert all(w["city"] == "Bengaluru" for w in wards_blr)
    
    print("✓ Wards endpoints and city filters passed")

def test_get_forecasts():
    # All forecasts
    response = client.get("/api/forecast/all")
    assert response.status_code == 200
    data = response.json()
    assert "forecasts" in data
    assert len(data["forecasts"]) == 18
    
    # Delhi forecasts
    response_delhi = client.get("/api/forecast/all?city=Delhi")
    assert response_delhi.status_code == 200
    forecasts_delhi = response_delhi.json()["forecasts"]
    assert len(forecasts_delhi) == 6
    
    # Specific ward forecast
    ward_id = forecasts_delhi[0]["ward_id"]
    response_ward = client.get(f"/api/forecast/{ward_id}")
    assert response_ward.status_code == 200
    forecast_ward = response_ward.json()
    assert forecast_ward["ward_id"] == ward_id
    assert "forecast_pm25_24h" in forecast_ward
    
    print("✓ Forecasts endpoints and city filters passed")

def test_get_priority():
    # All rankings
    response = client.get("/api/priority-ranking")
    assert response.status_code == 200
    data = response.json()
    assert "rankings" in data
    assert len(data["rankings"]) == 18
    
    # Sort check (priority_score descending)
    scores = [r["priority_score"] for r in data["rankings"]]
    assert scores == sorted(scores, reverse=True)
    
    # Mumbai rankings
    response_mumbai = client.get("/api/priority-ranking?city=Mumbai")
    assert response_mumbai.status_code == 200
    rankings_mumbai = response_mumbai.json()["rankings"]
    assert len(rankings_mumbai) == 6
    
    print("✓ Priority ranking endpoints and city filters passed")

def test_get_advisory_and_attribution():
    response = client.get("/api/wards")
    ward_id = response.json()["wards"][0]["ward_id"]
    
    # Advisory
    response_adv = client.get(f"/api/advisory/{ward_id}")
    assert response_adv.status_code == 200
    assert response_adv.json()["ward_id"] == ward_id
    
    # Attribution
    response_att = client.get(f"/api/attribution/{ward_id}")
    assert response_att.status_code == 200
    assert response_att.json()["ward_id"] == ward_id
    
    print("✓ Advisory and Attribution endpoints passed")

if __name__ == "__main__":
    print("Running integration tests...")
    test_health()
    test_get_wards()
    test_get_forecasts()
    test_get_priority()
    test_get_advisory_and_attribution()
    print("🎉 All integration tests passed successfully!")
