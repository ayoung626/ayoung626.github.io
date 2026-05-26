import os
import json
import requests
from datetime import datetime, timezone, timedelta

# Configuration
USERNAME = "Cobalt626"
# Chess.com requires a contact email in the User-Agent to avoid blocks
CONTACT_EMAIL = "andrew.young.analytics@gmail.com"  
OUTPUT_PATH = "assets/data/chess.json"

# Set timezone to Mountain Time (UTC-6 or UTC-7) based on -06:00 offset in user metadata
LOCAL_TZ = timezone(timedelta(hours=-6))

def fetch_chess_data():
    headers = {
        "User-Agent": f"GitHubPagesIntegration/1.0 (contact: {CONTACT_EMAIL})"
    }
    
    print(f"Fetching Chess.com statistics for user: {USERNAME}")
    
    # 1. Fetch Stats (Puzzle Ratings, Blitz, etc.)
    stats_url = f"https://api.chess.com/pub/player/{USERNAME}/stats"
    try:
        stats_res = requests.get(stats_url, headers=headers, timeout=15)
        stats_res.raise_for_status()
        stats = stats_res.json()
    except Exception as e:
        print(f"Error fetching statistics: {e}")
        stats = {}
    
    # Extract ratings
    puzzle_rating = stats.get("tactics", {}).get("last", {}).get("rating", "N/A")
    highest_puzzle_rating = stats.get("tactics", {}).get("highest", {}).get("rating", "N/A")
    puzzle_rush_best = stats.get("puzzle_rush", {}).get("best", {}).get("score", "N/A")
    
    # Extract win/loss/draw records for Daily/Rapid/Blitz to add rich stats
    rapid_record = stats.get("chess_rapid", {}).get("record", {})
    blitz_record = stats.get("chess_blitz", {}).get("record", {})
    rapid_rating = stats.get("chess_rapid", {}).get("last", {}).get("rating", "N/A")
    blitz_rating = stats.get("chess_blitz", {}).get("last", {}).get("rating", "N/A")
    
    # 2. Fetch Games for Streak Calculation
    archives_url = f"https://api.chess.com/pub/player/{USERNAME}/games/archives"
    active_streak = 0
    total_games_analyzed = 0
    played_dates = set()
    
    try:
        archives_res = requests.get(archives_url, headers=headers, timeout=15)
        if archives_res.status_code == 200:
            archives = archives_res.json().get("archives", [])
            if archives:
                # Fetch games from the last 2 monthly archives to guarantee continuity
                recent_archives = archives[-2:]
                
                for archive_url in recent_archives:
                    print(f"Analyzing games from archive: {archive_url.split('/')[-2:]}")
                    games_res = requests.get(archive_url, headers=headers, timeout=15)
                    if games_res.status_code == 200:
                        games = games_res.json().get("games", [])
                        total_games_analyzed += len(games)
                        for game in games:
                            end_time = game.get("end_time")
                            if end_time:
                                # Convert epoch to Mountain Time date string (YYYY-MM-DD)
                                date_str = datetime.fromtimestamp(end_time, tz=LOCAL_TZ).strftime("%Y-%m-%d")
                                played_dates.add(date_str)
            
            # Sort dates descending (most recent first)
            sorted_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in played_dates], reverse=True)
            
            # Calculate active daily game streak
            today = datetime.now(LOCAL_TZ).date()
            yesterday = today - timedelta(days=1)
            
            # Replicating Chess.com's Official 2-day Grace Period:
            # Gaps of <= 3 days between game days maintain the streak, rather than strict consecutive days.
            if sorted_dates and (sorted_dates[0] == today or sorted_dates[0] == yesterday or (today - sorted_dates[0]).days <= 2):
                active_streak = 1
                curr_date = sorted_dates[0]
                
                for next_date in sorted_dates[1:]:
                    diff = (curr_date - next_date).days
                    if diff <= 3:  # Meets Chess.com official grace period tolerance
                        if diff > 0:
                            active_streak += 1
                        curr_date = next_date
                    else:
                        break  # Streak broken
            else:
                active_streak = 0
                
            print(f"Calculated active streak: {active_streak} days. Played days: {len(played_dates)}")
    except Exception as e:
        print(f"Error calculating game streaks: {e}")

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
        "total_active_days": len(played_dates),
        "total_games_analyzed": total_games_analyzed,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    # Ensure directory exists and write file
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(payload, f, indent=4)
        
    print(f"Chess.com integration completed. Saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    fetch_chess_data()
