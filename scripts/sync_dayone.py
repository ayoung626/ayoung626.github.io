import sys
import os
import json
import datetime
import zoneinfo
import types

# Set up paths
# Mock brotli to prevent import crashes
sys.modules['brotli'] = types.ModuleType('brotli')

workspace = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(workspace, "scripts", "ccl_chrome_indexeddb"))
sys.path.append(os.path.join(workspace, "scripts", "ccl_simplesnappy"))

from ccl_chromium_reader import ccl_chromium_indexeddb

db_dir = r"C:\Users\andre\AppData\Local\Packages\22490Automattic.DayOneJournalPrivateDiary_9h07f78gwnchp\LocalCache\Roaming\Day One\IndexedDB\https_dayone.me_0.indexeddb.leveldb"

def sync_dayone():
    print("Opening Day One IndexedDB...")
    try:
        wrapper = ccl_chromium_indexeddb.WrappedIndexDB(db_dir, None)
        db = wrapper[1]  # DODexie
        obj_store = db['entries']
        
        dates = set()
        total_entries = 0
        
        for record in obj_store.iterate_records():
            val = record.value
            if not val:
                continue
            
            # Check if deleted
            if val.get('is_deleted', 0) == 1:
                continue
                
            timestamp_ms = val.get('date')
            if not timestamp_ms:
                continue
                
            total_entries += 1
            
            # Parse timestamp
            dt_utc = datetime.datetime.fromtimestamp(timestamp_ms / 1000.0, tz=datetime.timezone.utc)
            
            # Convert to local timezone
            tz_name = val.get('timezone', 'America/Denver')
            try:
                tz = zoneinfo.ZoneInfo(tz_name)
            except Exception:
                tz = zoneinfo.ZoneInfo('America/Denver')
                
            dt_local = dt_utc.astimezone(tz)
            date_str = dt_local.strftime("%Y-%m-%d")
            dates.add(date_str)
            
        sorted_dates = sorted(list(dates), reverse=True)
        
        streak = 0
        longest_streak = 0
        
        if sorted_dates:
            # Calculate active streak
            tz_utah = zoneinfo.ZoneInfo('America/Denver')
            today = datetime.datetime.now(tz_utah).date()
            yesterday = today - datetime.timedelta(days=1)
            
            latest_entry_date = datetime.datetime.strptime(sorted_dates[0], "%Y-%m-%d").date()
            
            if latest_entry_date in (today, yesterday):
                current_date = latest_entry_date
                idx = 0
                while idx < len(sorted_dates):
                    expected_str = current_date.strftime("%Y-%m-%d")
                    if sorted_dates[idx] == expected_str:
                        streak += 1
                        current_date -= datetime.timedelta(days=1)
                        idx += 1
                    elif sorted_dates[idx] > expected_str:
                        idx += 1
                    else:
                        break
            
            # Calculate longest streak
            temp_streak = 0
            expected_date = None
            
            for date_str in reversed(sorted_dates):
                d = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                if expected_date is None:
                    temp_streak = 1
                    expected_date = d + datetime.timedelta(days=1)
                elif d == expected_date:
                    temp_streak += 1
                    expected_date = d + datetime.timedelta(days=1)
                elif d > expected_date:
                    longest_streak = max(longest_streak, temp_streak)
                    temp_streak = 1
                    expected_date = d + datetime.timedelta(days=1)
                    
            longest_streak = max(longest_streak, temp_streak)
            
        # Write to JSON
        payload = {
            "current_streak": streak,
            "longest_streak": longest_streak,
            "total_entries": total_entries,
            "last_updated": datetime.datetime.now().isoformat()
        }
        
        out_dir = os.path.join(workspace, "assets", "data")
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, "dayone.json")
        
        with open(out_file, "w") as f:
            json.dump(payload, f, indent=2)
            
        print(f"Successfully synced Day One stats: {payload}")
        return True
    except Exception as e:
        print(f"Error syncing Day One: {e}")
        return False

if __name__ == "__main__":
    sync_dayone()
