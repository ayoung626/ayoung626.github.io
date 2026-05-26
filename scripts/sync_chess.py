import os
import re
import json
import requests
from datetime import datetime, timezone, timedelta

# Configuration
USERNAME = "Cobalt626"
# Chess.com requires a contact email in the User-Agent to avoid blocks
CONTACT_EMAIL = "andrew.young.analytics@gmail.com"  
OUTPUT_PATH = "assets/data/chess.json"

# Set timezone to Mountain Time (UTC-6)
LOCAL_TZ = timezone(timedelta(hours=-6))

def fetch_chess_data():
    # User agent that looks like a browser is required for member pages/callbacks
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"Fetching Chess.com statistics for user: {USERNAME}")
    
    # 1. Fetch Stats from the Callback stats endpoint (Gives current puzzle rating!)
    callback_url = f"https://www.chess.com/callback/member/stats/{USERNAME}"
    puzzle_rating = "N/A"
    highest_puzzle_rating = "N/A"
    puzzle_rush_best = "N/A"
    
    try:
        res = requests.get(callback_url, headers=headers, timeout=15)
        if res.status_code == 200:
            data = res.json()
            for item in data.get("stats", []):
                if item.get("key") == "tactics":
                    t_stats = item.get("stats", {})
                    puzzle_rating = t_stats.get("rating", "N/A")
                    highest_puzzle_rating = t_stats.get("highest_rating", "N/A")
                elif item.get("key") == "tactics_challenge":
                    puzzle_rush_best = item.get("stats", {}).get("highest_score", "N/A")
        else:
            print(f"Callback stats returned status: {res.status_code}")
    except Exception as e:
        print(f"Error fetching stats from callback: {e}")

    # 2. Fetch public API stats to fetch Blitz/Rapid records and ratings (PubAPI is still great for this!)
    stats_url = f"https://api.chess.com/pub/player/{USERNAME}/stats"
    rapid_record = {}
    blitz_record = {}
    rapid_rating = "N/A"
    blitz_rating = "N/A"
    
    try:
        pub_headers = {"User-Agent": f"GitHubPagesIntegration/1.0 (contact: {CONTACT_EMAIL})"}
        stats_res = requests.get(stats_url, headers=pub_headers, timeout=15)
        if stats_res.status_code == 200:
            stats = stats_res.json()
            rapid_record = stats.get("chess_rapid", {}).get("record", {})
            blitz_record = stats.get("chess_blitz", {}).get("record", {})
            rapid_rating = stats.get("chess_rapid", {}).get("last", {}).get("rating", "N/A")
            blitz_rating = stats.get("chess_blitz", {}).get("last", {}).get("rating", "N/A")
            
            # Backups in case callback failed
            if puzzle_rating == "N/A":
                # Fallback to PubAPI tactics highest
                highest_puzzle_rating = stats.get("tactics", {}).get("highest", {}).get("rating", "N/A")
            if puzzle_rush_best == "N/A":
                puzzle_rush_best = stats.get("puzzle_rush", {}).get("best", {}).get("score", "N/A")
    except Exception as e:
        print(f"Error fetching PubAPI stats: {e}")
        
    # 3. Scrape Member Profile page for official active daily/puzzle streak count!
    member_url = f"https://www.chess.com/member/{USERNAME}"
    active_streak = 0
    
    try:
        member_res = requests.get(member_url, headers=headers, timeout=15)
        if member_res.status_code == 200:
            streak_match = re.search(r'streakCount:\s*(\d+)', member_res.text)
            if streak_match:
                active_streak = int(streak_match.group(1))
                print(f"Scraped active streak from profile page: {active_streak} days")
            else:
                print("Could not find streakCount variable in profile HTML.")
    except Exception as e:
        print(f"Error scraping profile page for streak: {e}")

    # 4. Load existing JSON data to preserve rating history
    rating_history = []
    if os.path.exists(OUTPUT_PATH):
        try:
            with open(OUTPUT_PATH, "r") as f:
                existing_data = json.load(f)
                rating_history = existing_data.get("rating_history", [])
        except Exception as e:
            print(f"Error reading existing data file: {e}")

    # 5. Update Rating History over time
    today_str = datetime.now(LOCAL_TZ).strftime("%Y-%m-%d")
    
    # If we got a valid puzzle rating, update the history
    if isinstance(puzzle_rating, int):
        # Check if today is already in history, or if rating has changed
        date_exists = False
        for entry in rating_history:
            if entry.get("date") == today_str:
                entry["rating"] = puzzle_rating  # Update today's rating
                date_exists = True
                break
        
        if not date_exists:
            # If date doesn't exist, append new entry
            rating_history.append({
                "date": today_str,
                "rating": puzzle_rating
            })
            
        # Optional: Limit history length to last 180 entries to prevent huge files,
        # but keep it high enough for robust charts!
        rating_history = rating_history[-180:]

    # Assemble payload
    payload = {
        "username": USERNAME,
        "puzzle_rating": puzzle_rating,
        "highest_puzzle_rating": highest_puzzle_rating,
        "puzzle_rush_best": puzzle_rush_best,
        "rapid_rating": rapid_rating,
        "blitz_rating": blitz_rating,
        "rapid_record": rapid_record,
        "blitz_record": blitz_record,
        "active_game_streak": active_streak,
        "rating_history": rating_history,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    # Ensure directory exists and write file
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(payload, f, indent=4)
        
    print(f"Chess.com integration completed. Streak: {active_streak}, Rating: {puzzle_rating}. Saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    fetch_chess_data()
