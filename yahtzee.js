/**
 * yahtzee.js - Interactive Monte Carlo Strategy Simulator
 * Ports Andrew Young's high-performance Python simulation engine to JS.
 * Integrates directly with portfolio HSL styling, custom canvas distribution chart,
 * and dynamic category scoring indicators.
 */

// ============================================================================
// PART 1: CORE DICE ROLLING & SCORING (basicfunctions.py equivalents)
// ============================================================================

/**
 * Rolls up to 5 dice, keeping the values specified in rolllist.
 * Returns a counts object {1:x, 2:x, ... 6:x}
 */
function diceroll(rolllist = []) {
  const keeplist = [...rolllist];
  const dicenum = 5 - keeplist.length;
  for (let i = 0; i < dicenum; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    keeplist.push(roll);
  }
  
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  keeplist.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

/**
 * Scores the dice counts according to Yahtzee categories.
 * Returns a structure with original dice counts and available scores for open categories.
 */
function scoredice(dicedict) {
  const categorydict = {};
  let dicesum = 0;
  let max_count = 0;
  const counts = [];
  const dice_set = new Set();
  
  for (let i = 1; i <= 6; i++) {
    const count = dicedict[i] || 0;
    dicesum += i * count;
    if (count > max_count) max_count = count;
    if (count > 0) {
      counts.push(count);
      dice_set.add(i);
      categorydict[String(i)] = count * i;
    }
  }

  // Yahtzee (5 of a kind)
  if (max_count >= 5) {
    categorydict['Y'] = 50;
  }
  // Four of a kind
  if (max_count >= 4) {
    categorydict['4ok'] = dicesum;
  }
  // Three of a kind
  if (max_count >= 3) {
    categorydict['3ok'] = dicesum;
  }
  
  // Full House (3 of one number and 2 of another)
  const valCounts = Object.values(dicedict);
  if (valCounts.includes(3) && valCounts.includes(2)) {
    categorydict['FH'] = 25;
  }

  // Large Straight (5 consecutive values)
  if (dice_set.size === 5) {
    const minVal = Math.min(...dice_set);
    const maxVal = Math.max(...dice_set);
    if (maxVal - minVal === 4) {
      categorydict['LS'] = 40;
    }
  }

  // Small Straight (4 consecutive values)
  const setHasAll = (arr) => arr.every(val => dice_set.has(val));
  if (setHasAll([1, 2, 3, 4]) || setHasAll([2, 3, 4, 5]) || setHasAll([3, 4, 5, 6])) {
    categorydict['SS'] = 30;
  }

  // Chance
  categorydict['C'] = dicesum;

  return { dicedict, categorydict };
}

// ============================================================================
// PART 2: HELPER DECISION METHODS & STRATEGIES (strategies.py equivalents)
// ============================================================================

function _handle_yahtzee_bonus(scoringdict, categorydict) {
  if ('Y' in categorydict) {
    if (scoringdict['Y'] === null) {
      scoringdict['Y'] = categorydict['Y'];
      return true;
    } else if (scoringdict['Y'] !== 0) {
      for (const k in categorydict) {
        if (k !== 'Y') {
          categorydict[k] += 100;
        }
      }
    }
  }
  return false;
}

function _score_highest_available(scoringdict, categorydict, custom_zero_order = null) {
  let highestscore = -1;
  let highestkey = "";
  for (const k in categorydict) {
    if (scoringdict[k] === null) {
      if (categorydict[k] > highestscore) {
        highestscore = categorydict[k];
        highestkey = k;
      }
    }
  }
  if (highestkey !== "") {
    scoringdict[highestkey] = highestscore;
  } else {
    const zero_order = custom_zero_order || Object.keys(scoringdict);
    for (const k of zero_order) {
      if (scoringdict[k] === null) {
        scoringdict[k] = 0;
        break;
      }
    }
  }
}

function _score_mode_upper(scoringdict, categorydict, dicedict) {
  let modevalue = 0;
  let modekey = "";
  for (const k in categorydict) {
    if (/^\d$/.test(k) && scoringdict[k] === null) {
      const val = parseInt(k);
      if ((dicedict[val] || 0) > modevalue) {
        modevalue = dicedict[val];
        modekey = k;
      }
    }
  }
  if (modekey !== "") {
    scoringdict[modekey] = categorydict[modekey];
  } else if ('C' in categorydict && scoringdict['C'] === null) {
    scoringdict['C'] = categorydict['C'];
  } else {
    for (const k in scoringdict) {
      if (scoringdict[k] === null) {
        scoringdict[k] = 0;
        break;
      }
    }
  }
}

// 1. Primitive Strategy
function primitive(scoringdict) {
  const { dicedict, categorydict } = scoredice(diceroll());
  _score_highest_available(scoringdict, categorydict);
}

// 2. Advanced Human-Like Strategy
function advanced(scoringdict) {
  let rolldict = [];
  for (let t = 0; t < 3; t++) {
    const { dicedict, categorydict } = scoredice(diceroll(rolldict));
    if (_handle_yahtzee_bonus(scoringdict, categorydict)) {
      break;
    }
    
    // Check for 4 of a kind
    if ('4ok' in categorydict && scoringdict['4ok'] === null) {
      if (t === 2 || categorydict['4ok'] > 100) {
        scoringdict['4ok'] = categorydict['4ok'];
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 4) {
          rolldict = Array(4).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    // Full House is valuable and ends the turn immediately
    if ('FH' in categorydict && scoringdict['FH'] === null) {
      scoringdict['FH'] = categorydict['FH'];
      break;
    }

    // Check for 3 of a kind
    if ('3ok' in categorydict && scoringdict['3ok'] === null) {
      if (t === 2 || categorydict['3ok'] > 100) {
        scoringdict['3ok'] = categorydict['3ok'];
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 3) {
          rolldict = Array(3).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    // Large straight
    if ('LS' in categorydict && scoringdict['LS'] === null) {
      scoringdict['LS'] = categorydict['LS'];
      break;
    }

    // Small straight
    if ('SS' in categorydict && scoringdict['SS'] === null) {
      if (t === 2) {
        scoringdict['SS'] = categorydict['SS'];
        break;
      }
      if (dicedict[1] > 0 && dicedict[2] > 0) {
        rolldict = [1, 2, 3, 4];
        continue;
      }
      if (dicedict[6] > 0 && dicedict[5] > 0) {
        rolldict = [3, 4, 5, 6];
        continue;
      }
      rolldict = [2, 3, 4, 5];
      continue;
    }

    if (t < 2) continue;
    _score_highest_available(scoringdict, categorydict);
  }
}

// 3. Advanced Custom Order
function advancedCustomOrder(scoringdict) {
  let rolldict = [];
  for (let t = 0; t < 3; t++) {
    const { dicedict, categorydict } = scoredice(diceroll(rolldict));
    if (_handle_yahtzee_bonus(scoringdict, categorydict)) {
      break;
    }

    if ('4ok' in categorydict && scoringdict['4ok'] === null) {
      if (t === 2 || categorydict['4ok'] > 100) {
        scoringdict['4ok'] = categorydict['4ok'];
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 4) {
          rolldict = Array(4).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    if ('FH' in categorydict && scoringdict['FH'] === null) {
      scoringdict['FH'] = categorydict['FH'];
      break;
    }

    if ('3ok' in categorydict && scoringdict['3ok'] === null) {
      if (t === 2 || categorydict['3ok'] > 100) {
        scoringdict['3ok'] = categorydict['3ok'];
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 3) {
          rolldict = Array(3).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    if ('LS' in categorydict && scoringdict['LS'] === null) {
      scoringdict['LS'] = categorydict['LS'];
      break;
    }

    if ('SS' in categorydict && scoringdict['SS'] === null) {
      if (t === 2) {
        scoringdict['SS'] = categorydict['SS'];
        break;
      }
      if (dicedict[1] > 0 && dicedict[2] > 0) {
        rolldict = [1, 2, 3, 4];
        continue;
      }
      if (dicedict[6] > 0 && dicedict[5] > 0) {
        rolldict = [3, 4, 5, 6];
        continue;
      }
      rolldict = [2, 3, 4, 5];
      continue;
    }

    if (t < 2) continue;
    _score_highest_available(
      scoringdict,
      categorydict,
      ['1', '2', '3', '4', '5', '6', 'C', '3ok', '4ok', 'FH', 'SS', 'LS', 'Y']
    );
  }
}

// 4. Advanced Mode Upper
function advancedModeUpper(scoringdict) {
  let rolldict = [];
  for (let t = 0; t < 3; t++) {
    const { dicedict, categorydict } = scoredice(diceroll(rolldict));
    if (_handle_yahtzee_bonus(scoringdict, categorydict)) {
      break;
    }

    if ('4ok' in categorydict && scoringdict['4ok'] === null) {
      if (t === 2 || categorydict['4ok'] > 100) {
        scoringdict['4ok'] = categorydict['4ok'];
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 4) {
          rolldict = Array(4).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    if ('FH' in categorydict && scoringdict['FH'] === null) {
      scoringdict['FH'] = categorydict['FH'];
      break;
    }

    if ('3ok' in categorydict && scoringdict['3ok'] === null) {
      if (t === 2 || categorydict['3ok'] > 100) {
        scoringdict['3ok'] = categorydict['3ok'];
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 3) {
          rolldict = Array(3).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    if ('LS' in categorydict && scoringdict['LS'] === null) {
      scoringdict['LS'] = categorydict['LS'];
      break;
    }

    if ('SS' in categorydict && scoringdict['SS'] === null) {
      if (t === 2) {
        scoringdict['SS'] = categorydict['SS'];
        break;
      }
      if (dicedict[1] > 0 && dicedict[2] > 0) {
        rolldict = [1, 2, 3, 4];
        continue;
      }
      if (dicedict[6] > 0 && dicedict[5] > 0) {
        rolldict = [3, 4, 5, 6];
        continue;
      }
      rolldict = [2, 3, 4, 5];
      continue;
    }

    if (t < 2) continue;
    _score_mode_upper(scoringdict, categorydict, dicedict);
  }
}

// 5. Advanced Mode Upper Plus
function advancedModeUpperPlus(scoringdict) {
  let rolldict = [];
  for (let t = 0; t < 3; t++) {
    const { dicedict, categorydict } = scoredice(diceroll(rolldict));
    if (_handle_yahtzee_bonus(scoringdict, categorydict)) {
      break;
    }

    if ('LS' in categorydict && scoringdict['LS'] === null) {
      scoringdict['LS'] = categorydict['LS'];
      break;
    }

    if ('SS' in categorydict && scoringdict['SS'] === null) {
      if (t === 2) {
        scoringdict['SS'] = categorydict['SS'];
        break;
      }
      if (dicedict[1] > 0 && dicedict[2] > 0) {
        rolldict = [1, 2, 3, 4];
        continue;
      }
      if (dicedict[6] > 0 && dicedict[5] > 0) {
        rolldict = [3, 4, 5, 6];
        continue;
      }
      rolldict = [2, 3, 4, 5];
      continue;
    }

    if ('FH' in categorydict && scoringdict['FH'] === null) {
      scoringdict['FH'] = categorydict['FH'];
      break;
    }

    if ('4ok' in categorydict && scoringdict['4ok'] === null) {
      if (t === 2 || categorydict['4ok'] > 100) {
        let scored_upper = false;
        for (const x of [4, 5, 6]) {
          if ((dicedict[x] || 0) >= 4 && scoringdict[String(x)] === null) {
            scoringdict[String(x)] = categorydict[String(x)];
            scored_upper = true;
            break;
          }
        }
        if (!scored_upper) {
          scoringdict['4ok'] = categorydict['4ok'];
        }
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 4) {
          rolldict = Array(4).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    if ('3ok' in categorydict && scoringdict['3ok'] === null) {
      if (t === 2 || categorydict['3ok'] > 100) {
        let scored_upper = false;
        for (const x of [4, 5, 6]) {
          if ((dicedict[x] || 0) >= 3 && scoringdict[String(x)] === null) {
            scoringdict[String(x)] = categorydict[String(x)];
            scored_upper = true;
            break;
          }
        }
        if (!scored_upper) {
          scoringdict['3ok'] = categorydict['3ok'];
        }
        break;
      }
      let found = false;
      for (let k = 1; k <= 6; k++) {
        if (dicedict[k] === 3) {
          rolldict = Array(3).fill(k);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    if (t < 2) continue;
    _score_mode_upper(scoringdict, categorydict, dicedict);
  }
}

// Map strategy keys to functions
const STRATEGIES = {
  primitive,
  advanced,
  advancedCustomOrder,
  advancedModeUpper,
  advancedModeUpperPlus
};

// ============================================================================
// PART 3: MONTE CARLO SIMULATOR ENGINE (index.py equivalents)
// ============================================================================

/**
 * Runs a single game of 13 rounds using a strategy function.
 * Returns { totalscore, scoringdict }
 */
function runGame(strategyFunc) {
  const scoringdict = {
    'Y': null, 'FH': null, 'LS': null, 'SS': null, 'C': null,
    '4ok': null, '3ok': null,
    '1': null, '2': null, '3': null, '4': null, '5': null, '6': null
  };
  
  for (let i = 0; i < 13; i++) {
    strategyFunc(scoringdict);
  }
  
  let totalscore = 0;
  let uppersectionscore = 0;
  
  for (const k in scoringdict) {
    const v = scoringdict[k];
    if (v === null) {
      throw new Error(`The value of category ${k} is null.`);
    }
    totalscore += v;
    if (['1', '2', '3', '4', '5', '6'].includes(k)) {
      uppersectionscore += v;
    }
  }
  
  // Upper section bonus
  if (uppersectionscore >= 63) {
    totalscore += 35;
  }
  
  return { totalscore, scoringdict };
}

/**
 * Runs N games asynchronously to prevent browser freeze.
 * Returns simulation metrics.
 */
function runSimulation(strategyName, N = 1000) {
  const start_time = performance.now();
  const strategyFunc = STRATEGIES[strategyName];
  if (!strategyFunc) return null;
  
  const finalscoreslist = [];
  const percentagecategoriesdict = {
    'Y': 0, 'FH': 0, 'LS': 0, 'SS': 0, 'C': 0, '4ok': 0, '3ok': 0,
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0
  };
  
  for (let i = 0; i < N; i++) {
    const { totalscore, scoringdict } = runGame(strategyFunc);
    finalscoreslist.push(totalscore);
    for (const k in scoringdict) {
      if (scoringdict[k] > 0) {
        percentagecategoriesdict[k]++;
      }
    }
  }
  
  const end_time = performance.now();
  const durationMs = end_time - start_time;
  
  // Sort scores for percentile calculations and binning
  finalscoreslist.sort((a, b) => a - b);
  
  // Core Statistics
  const sum = finalscoreslist.reduce((a, b) => a + b, 0);
  const mean = sum / N;
  
  const variance = finalscoreslist.reduce((sumVal, score) => sumVal + Math.pow(score - mean, 2), 0) / (N - 1 || 1);
  const stdDev = Math.sqrt(variance);
  
  const sem = stdDev / Math.sqrt(N);
  const marginOfError = 1.96 * sem; // 95% Confidence Interval z-score
  
  const percentages = {};
  for (const k in percentagecategoriesdict) {
    percentages[k] = percentagecategoriesdict[k] / N;
  }
  
  return {
    mean,
    stdDev,
    confidenceInterval: [mean - marginOfError, mean + marginOfError],
    percentages,
    scores: finalscoreslist,
    duration: durationMs
  };
}

// ============================================================================
// PART 4: HIGH-PERFORMANCE VISUALIZATION & INTERACTIVITY
// ============================================================================

let currentSimData = null;
let activeTab = 'dist';
const categoryLabels = {
  'Y': 'Yahtzee (50 pts)',
  'FH': 'Full House (25 pts)',
  'LS': 'Large Straight (40 pts)',
  'SS': 'Small Straight (30 pts)',
  'C': 'Chance (Sum)',
  '4ok': '4 of a Kind (Sum)',
  '3ok': '3 of a Kind (Sum)',
  '1': 'Aces (1s)',
  '2': 'Deuces (2s)',
  '3': 'Threes (3s)',
  '4': 'Fours (4s)',
  '5': 'Fives (5s)',
  '6': 'Sixes (6s)'
};

/**
 * Draws the score distribution histogram on the HTML5 Canvas.
 */
function renderDistributionChart() {
  const canvas = document.getElementById('distribution-canvas');
  if (!canvas || !currentSimData) return;
  
  const container = canvas.parentElement;
  // Fit device pixel ratio for super-crisp drawing on high-DPI/Retina screens
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  
  const width = rect.width;
  const height = rect.height;
  
  // Set theme colors based on document body active theme
  const isDark = !document.body.classList.contains('light-theme');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const barGradientStart = isDark ? '#34d399' : '#059669'; // Mint vs. Dark Mint
  const barGradientEnd = isDark ? '#10b981' : '#047857';   // Emerald vs. Dark Emerald
  
  // Canvas Padding
  const padding = { top: 30, right: 30, bottom: 40, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  
  ctx.clearRect(0, 0, width, height);
  
  const scores = currentSimData.scores;
  const N = scores.length;
  const minScore = scores[0];
  const maxScore = scores[N - 1];
  const range = maxScore - minScore;
  
  // Determine optimal bin widths based on score range
  let binSize = 1;
  if (range > 200) binSize = 5;
  else if (range > 100) binSize = 2;
  
  const minBin = Math.floor(minScore / binSize) * binSize;
  const maxBin = Math.ceil(maxScore / binSize) * binSize;
  const binCount = (maxBin - minBin) / binSize;
  
  // Group scores into bins
  const bins = Array(binCount).fill(0);
  scores.forEach(score => {
    const binIdx = Math.floor((score - minBin) / binSize);
    if (binIdx >= 0 && binIdx < binCount) {
      bins[binIdx]++;
    }
  });
  
  const maxBinVal = Math.max(...bins) || 1;
  
  // Draw Grid Lines (Horizontal Y-Axis Grid)
  const yGridLines = 5;
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i <= yGridLines; i++) {
    const pct = i / yGridLines;
    const y = padding.top + graphHeight * (1 - pct);
    const labelVal = Math.round(pct * maxBinVal);
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    
    // Axis label
    ctx.fillText(labelVal, padding.left - 10, y);
  }
  
  // Draw X-Axis Labels (Scores)
  const xGridLines = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  for (let i = 0; i < xGridLines; i++) {
    const pct = i / (xGridLines - 1);
    const scoreVal = Math.round(minBin + pct * (maxBin - minBin));
    const x = padding.left + pct * graphWidth;
    
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
    
    ctx.fillText(scoreVal, x, height - padding.bottom + 8);
  }
  
  // Draw Bins (Histogram Bars)
  const barGap = 1;
  const barWidth = (graphWidth / binCount) - barGap;
  const scaleX = graphWidth / (maxBin - minBin);
  const scaleY = graphHeight / maxBinVal;
  
  const activeBars = []; // coordinates for tooltips
  
  for (let i = 0; i < binCount; i++) {
    const count = bins[i];
    if (count === 0) continue;
    
    const binStart = minBin + i * binSize;
    const x = padding.left + i * (barWidth + barGap);
    const barHeight = count * scaleY;
    const y = height - padding.bottom - barHeight;
    
    // Create gradient fill
    const grad = ctx.createLinearGradient(x, y, x, height - padding.bottom);
    grad.addColorStop(0, barGradientStart);
    grad.addColorStop(1, barGradientEnd);
    
    ctx.fillStyle = grad;
    // Round top corners of the bar slightly
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
    ctx.fill();
    
    // Save bar metadata for mouse interactions
    activeBars.push({
      x,
      y,
      w: barWidth,
      h: barHeight,
      scoreStart: binStart,
      scoreEnd: binStart + binSize - 1,
      count
    });
  }
  
  // Draw Gaussian / Normal Distribution Fit Line
  // This showcases a sleek, floating theoretical model curve overlaying the data
  ctx.beginPath();
  ctx.strokeStyle = isDark ? 'rgba(236, 72, 153, 0.8)' : 'rgba(219, 39, 119, 0.85)'; // pink accent
  ctx.lineWidth = 2.5;
  
  const mean = currentSimData.mean;
  const stdDev = currentSimData.stdDev;
  
  for (let screenX = padding.left; screenX <= width - padding.right; screenX++) {
    const pct = (screenX - padding.left) / graphWidth;
    const score = minBin + pct * (maxBin - minBin);
    
    // Normal distribution probability density function formula
    const exponent = -0.5 * Math.pow((score - mean) / stdDev, 2);
    const pdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    
    // Scale PDF. To match the discrete counts we multiply by binSize and total games N
    const expectedCount = pdf * binSize * N;
    const y = height - padding.bottom - expectedCount * scaleY;
    
    if (screenX === padding.left) {
      ctx.moveTo(screenX, Math.min(y, height - padding.bottom));
    } else {
      ctx.lineTo(screenX, Math.min(y, height - padding.bottom));
    }
  }
  ctx.stroke();
  
  // Attach coordinate metadata to canvas element for interactive tooltips
  canvas.activeBars = activeBars;
  canvas.padding = padding;
}

/**
 * Generates the category scoring frequency list cards.
 */
function renderCategoryFrequencies() {
  const container = document.getElementById('cat-metric-grid');
  if (!container || !currentSimData) return;
  
  container.innerHTML = '';
  
  // Sort categories logically (Yahtzee first, upper section last)
  const orderedKeys = ['Y', 'FH', 'LS', 'SS', 'C', '4ok', '3ok', '6', '5', '4', '3', '2', '1'];
  
  orderedKeys.forEach(k => {
    const val = currentSimData.percentages[k] || 0;
    const pctStr = (val * 100).toFixed(1) + '%';
    
    const card = document.createElement('div');
    card.className = 'glass-panel';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.background = 'rgba(255, 255, 255, 0.02)';
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--text-primary);">
        <span>${categoryLabels[k]}</span>
        <span style="font-family: 'JetBrains Mono', monospace; color: var(--accent-cyan);">${pctStr}</span>
      </div>
      <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; overflow: hidden; position: relative;">
        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${val * 100}%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple)); border-radius: 3px; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);"></div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================================================================
// PART 5: CONTROLLER BINDINGS & DYNAMIC EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Replications Slider
  const slider = document.getElementById('replications-slider');
  const sliderVal = document.getElementById('replications-value');
  
  if (slider && sliderVal) {
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      sliderVal.textContent = val.toLocaleString();
    });
  }
  
  // 2. Strategy Selector Chips
  const strategyChips = document.querySelectorAll('.strategy-chip');
  let selectedStrategy = 'primitive';
  
  strategyChips.forEach(chip => {
    chip.addEventListener('click', () => {
      strategyChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedStrategy = chip.getAttribute('data-strategy');
    });
  });
  
  // 3. Tab Switching Layouts
  const tabDist = document.getElementById('tab-dist');
  const tabCat = document.getElementById('tab-cat');
  const contentDist = document.getElementById('content-dist');
  const contentCat = document.getElementById('content-cat');
  
  function switchTab(tab) {
    activeTab = tab;
    if (tab === 'dist') {
      tabDist.classList.add('active');
      tabDist.style.color = 'var(--text-primary)';
      tabDist.style.fontWeight = '700';
      tabCat.classList.remove('active');
      tabCat.style.color = 'var(--text-secondary)';
      tabCat.style.fontWeight = '600';
      
      contentDist.style.display = 'flex';
      contentCat.style.display = 'none';
      setTimeout(renderDistributionChart, 50); // slight timeout to let rendering bounds adjust
    } else {
      tabCat.classList.add('active');
      tabCat.style.color = 'var(--text-primary)';
      tabCat.style.fontWeight = '700';
      tabDist.classList.remove('active');
      tabDist.style.color = 'var(--text-secondary)';
      tabDist.style.fontWeight = '600';
      
      contentCat.style.display = 'block';
      contentDist.style.display = 'none';
      renderCategoryFrequencies();
    }
  }
  
  if (tabDist && tabCat) {
    tabDist.addEventListener('click', () => switchTab('dist'));
    tabCat.addEventListener('click', () => switchTab('cat'));
  }
  
  // 4. Execution Core
  const runBtn = document.getElementById('run-simulation-btn');
  const loadingDisplay = document.getElementById('sim-loading');
  const statsDisplay = document.getElementById('stats-display');
  
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      // Toggle loading view states
      runBtn.disabled = true;
      runBtn.style.opacity = '0.6';
      if (loadingDisplay) loadingDisplay.style.display = 'flex';
      
      const replications = parseInt(slider.value);
      
      // Perform inside a setTimeout block to let browser show loading state immediately
      setTimeout(() => {
        try {
          const results = runSimulation(selectedStrategy, replications);
          currentSimData = results;
          
          // Animate statistics cards text
          document.getElementById('stat-mean').textContent = results.mean.toFixed(2);
          document.getElementById('stat-ci').textContent = `[${results.confidenceInterval[0].toFixed(1)}, ${results.confidenceInterval[1].toFixed(1)}]`;
          document.getElementById('stat-std').textContent = results.stdDev.toFixed(2);
          document.getElementById('stat-time').textContent = results.duration.toFixed(0) + ' ms';
          
          // Refresh visualizations
          if (activeTab === 'dist') {
            renderDistributionChart();
          } else {
            renderCategoryFrequencies();
          }
          
        } catch (err) {
          console.error(err);
        } finally {
          runBtn.disabled = false;
          runBtn.style.opacity = '1';
          if (loadingDisplay) loadingDisplay.style.display = 'none';
        }
      }, 350); // Small professional delay to match simulation feel
    });
  }
  
  // 5. Canvas Mouse Hover Tooltip Interactions
  const canvas = document.getElementById('distribution-canvas');
  const tooltip = document.getElementById('chart-tooltip');
  
  if (canvas && tooltip) {
    canvas.addEventListener('mousemove', (e) => {
      if (!canvas.activeBars || !canvas.padding) {
        tooltip.style.display = 'none';
        return;
      }
      
      // Find mouse coordinate inside canvas element boundaries
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      let hoverBar = null;
      for (const bar of canvas.activeBars) {
        if (mouseX >= bar.x && mouseX <= bar.x + bar.w) {
          // Inside horizontal width of bar. Is it close enough vertically?
          hoverBar = bar;
          break;
        }
      }
      
      if (hoverBar && currentSimData) {
        const N = currentSimData.scores.length;
        const pct = (hoverBar.count / N * 100).toFixed(2) + '%';
        
        // Calculate cumulative percentile of scores in this range
        const totalUnder = currentSimData.scores.filter(s => s < hoverBar.scoreStart).length;
        const percentile = (totalUnder / N * 100).toFixed(1);
        
        tooltip.innerHTML = `
          <div style="font-weight: 700; color: var(--accent-cyan); margin-bottom: 4px;">Score: ${hoverBar.scoreStart}${hoverBar.scoreStart !== hoverBar.scoreEnd ? '-' + hoverBar.scoreEnd : ''}</div>
          <div>Frequency: <span style="font-weight: 700;">${hoverBar.count} games</span> (${pct})</div>
          <div>Percentile: <span style="font-weight: 700;">${percentile}%</span></div>
        `;
        
        tooltip.style.display = 'block';
        tooltip.style.left = `${mouseX + 15}px`;
        tooltip.style.top = `${mouseY - 15}px`;
        
      } else {
        tooltip.style.display = 'none';
      }
    });
    
    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }
  
  // 6. Handle resizing and theme toggle triggers dynamically
  window.addEventListener('resize', () => {
    if (activeTab === 'dist') {
      renderDistributionChart();
    }
  });
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      // Small timeout to allow HSL stylesheet classes to settle
      setTimeout(() => {
        if (activeTab === 'dist') renderDistributionChart();
      }, 50);
    });
  }
  
  // 7. Auto Run initial simulation on load to populate visual layout instantly
  setTimeout(() => {
    if (runBtn) runBtn.click();
  }, 800);
});
