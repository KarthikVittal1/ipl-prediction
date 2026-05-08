#!/usr/bin/env python
"""
Quick test script to verify backend endpoints are working
Run this after starting the backend: python test_backend.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(name, method, endpoint, data=None):
    """Test a single endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json=data, timeout=5)
        
        status = "✅" if response.status_code == 200 else "❌"
        print(f"\n{status} {name}")
        print(f"   URL: {url}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            # Show sample data
            if isinstance(data, dict):
                keys = list(data.keys())[:3]
                print(f"   Keys: {keys}")
                for key in keys:
                    val = data[key]
                    if isinstance(val, list):
                        print(f"   - {key}: {len(val)} items")
                    else:
                        print(f"   - {key}: {val}")
        else:
            print(f"   Error: {response.text[:200]}")
    except Exception as e:
        print(f"\n❌ {name}")
        print(f"   Error: {str(e)}")

print("=" * 60)
print("Backend Endpoint Test")
print("=" * 60)

# Test endpoints
test_endpoint("Home", "GET", "/")
test_endpoint("Teams", "GET", "/teams")
test_endpoint("Venues", "GET", "/venues")
test_endpoint("Matches", "GET", "/matches?type=all&limit=5")
test_endpoint("Points Table", "GET", "/points-table?season=2026")
test_endpoint("Predict", "POST", "/predict", {
    "team_a": "Chennai Super Kings",
    "team_b": "Mumbai Indians",
    "venue": "chepauk",
    "toss_winner": "Chennai Super Kings",
    "toss_decision": "bat"
})

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)
