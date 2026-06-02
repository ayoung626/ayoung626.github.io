/**
 * 👑 LinkedIn Games Streaks Synchronizer Bookmarklet
 * 
 * Instructions:
 * 1. Copy the code block below.
 * 2. Create a new bookmark in your browser (Chrome/Safari/Firefox).
 * 3. Set the Bookmark Name to "👑 Sync Streaks".
 * 4. Paste the copied code block into the Bookmark URL (Address) field.
 * 5. Visit https://www.linkedin.com/games, click the bookmark, fill in your GitHub PAT and click Sync!
 */

javascript:(function(){
  const CSS = `
    #lk-sync-modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 420px; background: rgba(15, 23, 42, 0.98); border: 1px solid #34d399;
      border-radius: 16px; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;
      padding: 24px; z-index: 999999; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6), 0 0 45px rgba(52, 211, 153, 0.2);
      backdrop-filter: blur(20px); box-sizing: border-box;
    }
    #lk-sync-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8); z-index: 999998; backdrop-filter: blur(5px);
    }
    .lk-sync-title { font-size: 20px; font-weight: 700; color: #34d399; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
    .lk-sync-label { display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
    .lk-sync-input { width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; margin-bottom: 12px; font-size: 13px; box-sizing: border-box; }
    .lk-sync-input:focus { outline: none; border-color: #34d399; background: rgba(255,255,255,0.1); }
    .lk-sync-row { display: flex; gap: 12px; }
    .lk-sync-col { flex: 1; }
    .lk-sync-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #34d399, #10b981); border: none; border-radius: 8px; color: #fff; font-weight: 700; cursor: pointer; font-size: 14px; margin-top: 8px; transition: opacity 0.2s; }
    .lk-sync-btn:hover { opacity: 0.9; }
    .lk-sync-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #64748b; font-size: 22px; cursor: pointer; line-height: 1; }
    .lk-sync-close:hover { color: #f8fafc; }
    .lk-sync-status { font-size: 13px; color: #10b981; margin-top: 12px; text-align: center; display: none; font-weight: 600; }
  `;

  // Inject CSS Styles if they aren't loaded
  if (!document.getElementById('lk-sync-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'lk-sync-styles';
    styleEl.innerHTML = CSS;
    document.head.appendChild(styleEl);
  }

  // Create Modal Elements
  const overlay = document.createElement('div');
  overlay.id = 'lk-sync-overlay';
  const modal = document.createElement('div');
  modal.id = 'lk-sync-modal';

  // Parse LinkedIn Games Streaks from DOM
  const scrapeStreaks = () => {
    const results = { queens: 0, pinpoint: 0, crossclimb: 0, tango: 0 };
    try {
      const cards = Array.from(document.querySelectorAll('a, div, section')).filter(el => {
        const t = el.innerText || '';
        return t.includes('Queens') || t.includes('Pinpoint') || t.includes('Crossclimb') || t.includes('Tango');
      });
      cards.forEach(card => {
        const text = card.innerText || '';
        let game = '';
        if (text.includes('Queens')) game = 'queens';
        else if (text.includes('Pinpoint')) game = 'pinpoint';
        else if (text.includes('Crossclimb')) game = 'crossclimb';
        else if (text.includes('Tango')) game = 'tango';

        if (game) {
          // Look for regex matching numbers near the game label
          const match = text.match(/(\d+)\s*-\s*day|streak\s*:?\s*(\d+)|(\d+)\s*days?/i);
          if (match) {
            const val = parseInt(match[1] || match[2] || match[3]);
            if (!isNaN(val) && val > results[game]) results[game] = val;
          }
        }
      });
    } catch(e) { console.warn("LinkedIn Scraper: Failed parsing streaks:", e); }
    return results;
  };

  const scraped = scrapeStreaks();
  const storedToken = localStorage.getItem('lk_github_token') || '';
  const storedRepo = localStorage.getItem('lk_github_repo') || 'ayoung626/ayoung626.github.io';
  const storedPath = localStorage.getItem('lk_github_path') || 'assets/data/linkedin-games.json';

  modal.innerHTML = `
    <button class="lk-sync-close" onclick="document.getElementById('lk-sync-overlay').remove(); document.getElementById('lk-sync-modal').remove();">&times;</button>
    <h3 class="lk-sync-title">👑 LinkedIn Streaks Sync</h3>
    
    <label class="lk-sync-label">GitHub Personal Access Token</label>
    <input type="password" id="lk-token" class="lk-sync-input" value="${storedToken}" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
    
    <div class="lk-sync-row">
      <div class="lk-sync-col">
        <label class="lk-sync-label">Repository</label>
        <input type="text" id="lk-repo" class="lk-sync-input" value="${storedRepo}" placeholder="username/repo">
      </div>
      <div class="lk-sync-col">
        <label class="lk-sync-label">JSON Path</label>
        <input type="text" id="lk-path" class="lk-sync-input" value="${storedPath}" placeholder="assets/data/linkedin-games.json">
      </div>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 0 12px 0; padding-top: 12px;">
      <span class="lk-sync-label" style="color: #34d399; margin-bottom: 8px;">Verify Extracted Daily Streaks</span>
      <div class="lk-sync-row">
        <div class="lk-sync-col">
          <label class="lk-sync-label">👑 Queens</label>
          <input type="number" id="lk-queens" class="lk-sync-input" value="${scraped.queens}">
        </div>
        <div class="lk-sync-col">
          <label class="lk-sync-label">📍 Pinpoint</label>
          <input type="number" id="lk-pinpoint" class="lk-sync-input" value="${scraped.pinpoint}">
        </div>
      </div>
      <div class="lk-sync-row">
        <div class="lk-sync-col">
          <label class="lk-sync-label">🧗 Crossclimb</label>
          <input type="number" id="lk-crossclimb" class="lk-sync-input" value="${scraped.crossclimb}">
        </div>
        <div class="lk-sync-col">
          <label class="lk-sync-label">✨ Tango</label>
          <input type="number" id="lk-tango" class="lk-sync-input" value="${scraped.tango}">
        </div>
      </div>
    </div>

    <button id="lk-sync-submit" class="lk-sync-btn">Save &amp; Commit</button>
    <div id="lk-sync-status" class="lk-sync-status"></div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  overlay.onclick = () => { overlay.remove(); modal.remove(); };

  document.getElementById('lk-sync-submit').onclick = async () => {
    const token = document.getElementById('lk-token').value.trim();
    const repo = document.getElementById('lk-repo').value.trim();
    const path = document.getElementById('lk-path').value.trim();
    const statusDiv = document.getElementById('lk-sync-status');

    if (!token || !repo || !path) { alert("Missing GitHub details."); return; }

    // Save tokens in browser localStorage
    localStorage.setItem('lk_github_token', token);
    localStorage.setItem('lk_github_repo', repo);
    localStorage.setItem('lk_github_path', path);

    statusDiv.style.display = 'block';
    statusDiv.style.color = '#94a3b8';
    statusDiv.innerText = "Syncing with GitHub...";

    const payload = {
      lastUpdated: new Date().toISOString(),
      games: {
        queens: { name: "Queens", streak: parseInt(document.getElementById('lk-queens').value) || 0, icon: "crown" },
        pinpoint: { name: "Pinpoint", streak: parseInt(document.getElementById('lk-pinpoint').value) || 0, icon: "map-pin" },
        crossclimb: { name: "Crossclimb", streak: parseInt(document.getElementById('lk-crossclimb').value) || 0, icon: "mountain" },
        tango: { name: "Tango", streak: parseInt(document.getElementById('lk-tango').value) || 0, icon: "sparkles" }
      }
    };

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    const headers = { "Authorization": `token ${token}`, "Accept": "application/vnd.github.v3+json" };

    try {
      let sha = null;
      try {
        const getRes = await fetch(apiUrl, { headers });
        if (getRes.ok) { 
          const getData = await getRes.json(); 
          sha = getData.sha; 
        }
      } catch(e){}

      const body = {
        message: "Update LinkedIn Game Streaks via Bookmarklet",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2)))),
        sha: sha || undefined
      };

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        statusDiv.style.color = '#10b981';
        statusDiv.innerText = "🚀 Streaks committed successfully!";
        setTimeout(() => { overlay.remove(); modal.remove(); }, 1200);
      } else {
        const err = await putRes.json();
        statusDiv.style.color = '#ef4444';
        statusDiv.innerText = `Error: ${err.message}`;
      }
    } catch (err) {
      statusDiv.style.color = '#ef4444';
      statusDiv.innerText = `Error: ${err.message}`;
    }
  };
})();
