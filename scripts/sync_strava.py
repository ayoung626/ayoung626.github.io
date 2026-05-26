import os
import json
import base64
import requests
from datetime import datetime, timezone

# Configuration
OUTPUT_PATH = "assets/data/activities.json"

def rotate_and_sync_strava():
    # Fetch environment variables from GitHub Secrets
    client_id = os.environ.get("STRAVA_CLIENT_ID")
    client_secret = os.environ.get("STRAVA_CLIENT_SECRET")
    refresh_token = os.environ.get("STRAVA_REFRESH_TOKEN")
    pat_token = os.environ.get("PAT_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY") # Automatically provided by GitHub Actions
    
    if not all([client_id, client_secret, refresh_token]):
        print("Missing required Strava secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or STRAVA_REFRESH_TOKEN.")
        print("Skipping Strava synchronization.")
        return

    print("Refreshing Strava access token...")
    
    # 1. Exchange Refresh Token for Access Token
    token_url = "https://www.strava.com/oauth/token"
    try:
        res = requests.post(token_url, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }, timeout=15)
        res.raise_for_status()
        token_data = res.json()
    except Exception as e:
        print(f"Error authenticating with Strava API: {e}")
        return

    new_access_token = token_data.get("access_token")
    new_refresh_token = token_data.get("refresh_token")
    
    if not new_access_token:
        print("Failed to acquire new access token from Strava response.")
        return

    print("Fetching athlete activities...")
    
    # 2. Fetch Recent Activities (last 10 workouts)
    activities_url = "https://www.strava.com/api/v3/athlete/activities"
    try:
        act_res = requests.get(activities_url, headers={
            "Authorization": f"Bearer {new_access_token}"
        }, params={
            "per_page": 10
        }, timeout=15)
        act_res.raise_for_status()
        activities = act_res.json()
    except Exception as e:
        print(f"Error fetching workouts from Strava: {e}")
        return

    # Write activities to local assets/data/activities.json
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(activities, f, indent=4)
    print(f"Successfully saved {len(activities)} workouts to {OUTPUT_PATH}")

    # 3. Handle Token Rotation (Write back new refresh token to GitHub secrets)
    # Strava updates the refresh token frequently, so we must save the newly rotated value.
    if new_refresh_token and new_refresh_token != refresh_token:
        if not pat_token or not repo:
            print("Warning: New refresh token generated, but PAT_TOKEN or GITHUB_REPOSITORY is missing.")
            print("Cannot update GitHub Secrets. The current credentials may expire soon.")
            return
            
        print("New refresh token detected. Rotating secret on GitHub...")
        
        try:
            # We import PyNaCl inside the conditional to avoid dependency errors if running locally without it
            from nacl import encoding, public
            
            # Fetch repository's public key from GitHub API
            pub_key_url = f"https://api.github.com/repos/{repo}/actions/secrets/public-key"
            headers = {
                "Authorization": f"token {pat_token}",
                "Accept": "application/vnd.github.v3+json"
            }
            
            key_res = requests.get(pub_key_url, headers=headers, timeout=15)
            key_res.raise_for_status()
            key_data = key_res.json()
            
            public_key_str = key_data.get("key")
            key_id = key_data.get("key_id")
            
            # Encrypt the new refresh token using NaCl SealedBox
            public_key = public.PublicKey(public_key_str.encode("utf-8"), encoding.Base64Encoder())
            sealed_box = public.SealedBox(public_key)
            encrypted_bytes = sealed_box.encrypt(new_refresh_token.encode("utf-8"))
            encrypted_value = base64.b64encode(encrypted_bytes).decode("utf-8")
            
            # Upload the encrypted secret back to GitHub
            secret_url = f"https://api.github.com/repos/{repo}/actions/secrets/STRAVA_REFRESH_TOKEN"
            put_res = requests.put(secret_url, headers=headers, json={
                "encrypted_value": encrypted_value,
                "key_id": key_id
            }, timeout=15)
            put_res.raise_for_status()
            print("Successfully updated STRAVA_REFRESH_TOKEN secret in GitHub Repository!")
            
        except ImportError:
            print("Warning: 'pynacl' library is not installed locally. Cannot update repository secrets.")
            print("Note: This is normal when testing locally. The GitHub Actions runner will handle rotation automatically.")
        except Exception as e:
            print(f"Error rotating STRAVA_REFRESH_TOKEN on GitHub: {e}")

if __name__ == "__main__":
    rotate_and_sync_strava()
