#!/usr/bin/env python
import asyncio
from app import get_players

async def test_teams():
    teams = [
        ("RCB", "Abbreviation"),
        ("Royal Challengers Bengaluru", "Full name"),
        ("MI", "Abbreviation"),
        ("Mumbai Indians", "Full name"),
    ]
    
    for team, desc in teams:
        print(f"\nTesting: {team} ({desc})")
        result = await get_players(team=team)
        print(f"  Result: {result['total']} players")
        if result['total'] > 0:
            print(f"  First player: {result['players'][0]['name']}")

if __name__ == "__main__":
    asyncio.run(test_teams())
