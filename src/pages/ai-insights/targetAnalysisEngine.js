function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function mean(nums) {
  if (!Array.isArray(nums) || !nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function stdev(nums) {
  if (!Array.isArray(nums) || nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((acc, n) => acc + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function normalizeCandles(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((c) => ({
      time: Math.floor(Number(c?.time)),
      open: Number(c?.open),
      high: Number(c?.high),
      low: Number(c?.low),
      close: Number(c?.close),
    }))
    .filter((c) => Number.isFinite(c.time) && [c.open, c.high, c.low, c.close].every(Number.isFinite))
    .sort((a, b) => a.time - b.time);
}

function trueRange(prevClose, candle) {
  const h = candle.high;
  const l = candle.low;
  const pc = Number.isFinite(prevClose) ? prevClose : candle.open;
  return Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
}

function computeATR(candles, period = 14) {
  const arr = Array.isArray(candles) ? candles : [];
  if (arr.length < 2) return 0;
  const p = clamp(Math.floor(period), 3, 60);
  const start = Math.max(1, arr.length - p);
  const trs = [];
  for (let i = start; i < arr.length; i += 1) {
    trs.push(trueRange(arr[i - 1].close, arr[i]));
  }
  return mean(trs);
}

function computeRSI(closes, period = 14) {
  const arr = Array.isArray(closes) ? closes : [];
  if (arr.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = arr.length - period; i < arr.length; i += 1) {
    const diff = arr[i] - arr[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function findPivots(candles, left = 3, right = 3) {
  const arr = Array.isArray(candles) ? candles : [];
  const l = clamp(Math.floor(left), 1, 10);
  const r = clamp(Math.floor(right), 1, 10);
  const highs = [];
  const lows = [];

  for (let i = l; i < arr.length - r; i += 1) {
    const c = arr[i];
    let isHigh = true;
    let isLow = true;
    for (let j = i - l; j <= i + r; j += 1) {
      if (j === i) continue;
      if (arr[j].high >= c.high) isHigh = false;
      if (arr[j].low <= c.low) isLow = false;
      if (!isHigh && !isLow) break;
    }
    if (isHigh) highs.push({ time: c.time, value: c.high, index: i });
    if (isLow) lows.push({ time: c.time, value: c.low, index: i });
  }

  return { highs, lows };
}

function clusterLevels(prices, tolerance) {
  const values = (Array.isArray(prices) ? prices : [])
    .map((p) => Number(p))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!values.length) return [];
  const tol = Number.isFinite(tolerance) && tolerance > 0 ? tolerance : 0;

  const clusters = [];
  let current = [values[0]];
  for (let i = 1; i < values.length; i += 1) {
    const v = values[i];
    const last = current[current.length - 1];
    if (Math.abs(v - last) <= tol) current.push(v);
    else {
      clusters.push(current);
      current = [v];
    }
  }
  clusters.push(current);

  return clusters
    .map((c) => {
      const m = mean(c);
      return {
        price: m,
        min: Math.min(...c),
        max: Math.max(...c),
        hits: c.length,
      };
    })
    .sort((a, b) => b.hits - a.hits);
}

function linearRegression(points) {
  const pts = Array.isArray(points) ? points : [];
  if (pts.length < 2) return null;
  const xs = pts.map((p, idx) => idx);
  const ys = pts.map((p) => p);

  const xBar = mean(xs);
  const yBar = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const dx = xs[i] - xBar;
    num += dx * (ys[i] - yBar);
    den += dx * dx;
  }
  if (den === 0) return null;
  const slope = num / den;
  const intercept = yBar - slope * xBar;

  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const pred = intercept + slope * xs[i];
    ssTot += (ys[i] - yBar) ** 2;
    ssRes += (ys[i] - pred) ** 2;
  }

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function formatPct(n, digits = 1) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "--";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
}

function directionFromScore(score) {
  if (score > 0.22) return "Bullish";
  if (score < -0.22) return "Bearish";
  return "Neutral";
}

function riskFromAtrPct(atrPct) {
  const v = Number(atrPct);
  if (!Number.isFinite(v)) return "Medium";
  if (v >= 6) return "High";
  if (v >= 2.5) return "Medium";
  return "Low";
}

function probabilityFromDistance({ distAtr, tfDays, alignScore, obstacleCount, atrPct }) {
  const dist = Number(distAtr);
  const days = Number(tfDays);
  const align = Number(alignScore);
  const obstacles = Math.max(0, Math.floor(Number(obstacleCount) || 0));
  const vol = Number(atrPct);

  if (!Number.isFinite(dist)) return 0.2;
  if (dist <= 0) return 0.85;
  const timeFactor = clamp(Math.log10((Number.isFinite(days) ? days : 30) + 1) / 1.1 + 0.7, 0.7, 1.2);
  const base = Math.exp((-0.52 * dist) / timeFactor);

  const alignAdj = clamp(0.14 * align, -0.18, 0.18);
  const obstacleAdj = clamp(-0.08 * obstacles, -0.32, 0);
  const volAdj = Number.isFinite(vol) ? clamp((vol - 2.2) * 0.012, -0.05, 0.07) : 0;

  return clamp(base + alignAdj + obstacleAdj + volAdj, 0.03, 0.92);
}

function buildTargetSuggestion({ current, atr, side, levels }) {
  const c = Number(current);
  const a = Number(atr);
  if (!Number.isFinite(c) || !Number.isFinite(a) || a <= 0) return null;
  const supports = Array.isArray(levels?.supports) ? levels.supports : [];
  const resistances = Array.isArray(levels?.resistances) ? levels.resistances : [];

  const nearDist = 2.0 * a;
  const farDist = 3.2 * a;

  const preferredNear =
    side === "up"
      ? resistances.find((l) => Number.isFinite(Number(l)) && Number(l) > c) || c + nearDist
      : supports
          .slice()
          .reverse()
          .find((l) => Number.isFinite(Number(l)) && Number(l) < c) || c - nearDist;

  const preferredFar =
    side === "up"
      ? resistances.find((l) => Number.isFinite(Number(l)) && Number(l) > preferredNear) ||
        c + farDist
      : supports
          .slice()
          .reverse()
          .find((l) => Number.isFinite(Number(l)) && Number(l) < preferredNear) || c - farDist;

  return {
    near: preferredNear,
    far: preferredFar,
  };
}

function detectTriangle({ pivots, currentClose, atr }) {
  const highs = pivots?.highs || [];
  const lows = pivots?.lows || [];
  if (highs.length < 3 || lows.length < 3) return null;

  const h = highs.slice(-3);
  const l = lows.slice(-3);

  const highsDown = h[0].value > h[1].value && h[1].value > h[2].value;
  const lowsUp = l[0].value < l[1].value && l[1].value < l[2].value;
  if (!highsDown || !lowsUp) return null;

  const widthStart = h[0].value - l[0].value;
  const widthEnd = h[2].value - l[2].value;
  if (!(widthStart > 0 && widthEnd > 0)) return null;

  const narrowing = widthEnd / widthStart;
  const a = Number(atr);
  const close = Number(currentClose);
  const scale = Number.isFinite(a) && a > 0 ? a : Math.max(1e-6, close * 0.002);

  const confidence = clamp(0.55 + (1 - narrowing) * 0.35 + clamp(scale / Math.max(1e-6, widthEnd), 0, 1) * 0.1, 0, 0.9);
  if (confidence < 0.62) return null;

  return {
    type: "Triangle",
    confidence,
    summary: "Lower highs + higher lows with narrowing range.",
    overlays: {
      trendlines: [
        {
          key: "triangle-highs",
          color: "rgba(255,255,255,0.55)",
          width: 2,
          points: [
            { time: h[0].time, value: h[0].value },
            { time: h[2].time, value: h[2].value },
          ],
        },
        {
          key: "triangle-lows",
          color: "rgba(255,255,255,0.55)",
          width: 2,
          points: [
            { time: l[0].time, value: l[0].value },
            { time: l[2].time, value: l[2].value },
          ],
        },
      ],
    },
  };
}

function detectChannel({ closes, times }) {
  if (!Array.isArray(closes) || closes.length < 18) return null;
  const window = closes.slice(-60);
  const reg = linearRegression(window);
  if (!reg) return null;

  const { slope, intercept, r2 } = reg;
  const slopeNorm = slope / Math.max(1e-9, mean(window));
  const strength = Math.abs(slopeNorm) * 100;

  const residuals = window.map((y, i) => y - (intercept + slope * i));
  const resDev = stdev(residuals);

  const confidence = clamp(0.45 + clamp(r2, 0, 1) * 0.45 + clamp(strength / 1.2, 0, 0.2), 0, 0.9);
  if (confidence < 0.62) return null;

  const lastIdx = window.length - 1;
  const startIdx = 0;
  const startVal = intercept + slope * startIdx;
  const endVal = intercept + slope * lastIdx;

  const startTime = Array.isArray(times) && times.length ? times[Math.max(0, times.length - window.length)] : null;
  const endTime = Array.isArray(times) && times.length ? times[times.length - 1] : null;
  if (!Number.isFinite(Number(startTime)) || !Number.isFinite(Number(endTime))) return null;

  const band = 1.6 * resDev;
  return {
    type: slope > 0 ? "Rising Channel" : "Falling Channel",
    confidence,
    summary: `Regression channel with r²=${r2.toFixed(2)}.`,
    overlays: {
      trendlines: [
        {
          key: "channel-mid",
          color: "rgba(57,198,255,0.55)",
          width: 2,
          points: [
            { time: startTime, value: startVal },
            { time: endTime, value: endVal },
          ],
        },
        {
          key: "channel-top",
          color: "rgba(255,255,255,0.42)",
          width: 1,
          points: [
            { time: startTime, value: startVal + band },
            { time: endTime, value: endVal + band },
          ],
        },
        {
          key: "channel-bottom",
          color: "rgba(255,255,255,0.42)",
          width: 1,
          points: [
            { time: startTime, value: startVal - band },
            { time: endTime, value: endVal - band },
          ],
        },
      ],
    },
  };
}

function detectHeadAndShoulders({ pivots, currentClose }) {
  const highs = pivots?.highs || [];
  const lows = pivots?.lows || [];
  if (highs.length < 5 || lows.length < 4) return null;

  const h = highs.slice(-5);
  const p1 = h[0];
  const p2 = h[2];
  const p3 = h[4];
  if (!(p2.value > p1.value && p2.value > p3.value)) return null;

  const shoulderDiff = Math.abs(p1.value - p3.value) / Math.max(1e-9, p2.value);
  if (shoulderDiff > 0.06) return null;

  const peakGap = (p2.value - Math.max(p1.value, p3.value)) / Math.max(1e-9, p2.value);
  if (peakGap < 0.03) return null;

  const lowBetween1 = lows.find((l) => l.time > p1.time && l.time < p2.time);
  const lowBetween2 = lows.find((l) => l.time > p2.time && l.time < p3.time);
  if (!lowBetween1 || !lowBetween2) return null;

  const neckline = mean([lowBetween1.value, lowBetween2.value]);
  const close = Number(currentClose);
  const broke = Number.isFinite(close) && close < neckline;

  const confidence = clamp(0.55 + (broke ? 0.18 : 0.06) + clamp(peakGap / 0.08, 0, 0.14), 0, 0.9);
  if (confidence < 0.62) return null;

  return {
    type: "Head & Shoulders",
    confidence,
    summary: broke
      ? "Possible H&S with a neckline break (bearish)."
      : "Possible H&S forming; neckline not broken.",
    overlays: {
      priceLines: [
        {
          key: "hs-neckline",
          price: neckline,
          color: "rgba(239,68,68,0.65)",
          title: "Neckline",
          lineStyle: 2,
          lineWidth: 2,
        },
      ],
    },
  };
}

function detectFlag({ candles, atrPct }) {
  const arr = Array.isArray(candles) ? candles : [];
  if (arr.length < 40) return null;

  const window = arr.slice(-55);
  const impulseLen = 22;
  const consLen = 16;
  if (window.length < impulseLen + consLen + 2) return null;

  const impulseStart = window[window.length - (impulseLen + consLen)];
  const impulseEnd = window[window.length - (consLen + 1)];
  const cons = window.slice(window.length - consLen);

  const start = impulseStart?.close;
  const end = impulseEnd?.close;
  if (!(Number.isFinite(start) && Number.isFinite(end) && start > 0)) return null;
  const impulseChangePct = ((end - start) / start) * 100;

  let consHigh = -Infinity;
  let consLow = Infinity;
  for (const c of cons) {
    if (c.high > consHigh) consHigh = c.high;
    if (c.low < consLow) consLow = c.low;
  }
  if (!Number.isFinite(consHigh) || !Number.isFinite(consLow) || end <= 0) return null;

  const consRangePct = ((consHigh - consLow) / end) * 100;
  const impulseAbs = Math.abs(impulseChangePct);

  const vol = Number.isFinite(Number(atrPct)) ? Number(atrPct) : 2.5;
  const impulseThreshold = Math.max(4.8, vol * 1.35);
  if (impulseAbs < impulseThreshold) return null;
  if (consRangePct > impulseAbs * 0.65) return null;

  const confidence = clamp(
    0.54 +
      clamp((impulseAbs - impulseThreshold) / 10, 0, 0.18) +
      clamp((impulseAbs - consRangePct) / Math.max(1e-9, impulseAbs), 0, 0.22),
    0,
    0.9,
  );
  if (confidence < 0.62) return null;

  const dir = impulseChangePct > 0 ? "Bullish" : "Bearish";
  return {
    type: "Flag",
    confidence,
    summary: `Strong ${dir.toLowerCase()} impulse with consolidation range compression.`,
    overlays: {
      priceLines: [
        {
          key: "flag-high",
          price: consHigh,
          color: "rgba(255,255,255,0.40)",
          title: "Flag",
          lineStyle: 2,
          lineWidth: 1,
        },
        {
          key: "flag-low",
          price: consLow,
          color: "rgba(255,255,255,0.40)",
          title: "",
          lineStyle: 2,
          lineWidth: 1,
        },
      ],
    },
  };
}

function detectZones({ pivots, currentClose, tolerance }) {
  const highs = pivots?.highs || [];
  const lows = pivots?.lows || [];
  const close = Number(currentClose);
  const tol = Number.isFinite(Number(tolerance)) ? Number(tolerance) : 0;

  const lowClusters = clusterLevels(lows.map((p) => p.value), tol);
  const highClusters = clusterLevels(highs.map((p) => p.value), tol);

  const demand = lowClusters.find((c) => c.max < close) || lowClusters[0] || null;
  const supply = highClusters.find((c) => c.min > close) || highClusters[0] || null;

  function scoreZone(cluster) {
    if (!cluster) return 0;
    const width = Math.max(0, Number(cluster.max) - Number(cluster.min));
    const hitScore = clamp((Number(cluster.hits) - 1) / 5, 0, 1);
    const widthScore = tol > 0 ? clamp(1 - width / (tol * 3.5), 0, 1) : 0.5;
    return clamp(0.52 + 0.28 * hitScore + 0.12 * widthScore, 0, 0.9);
  }

  const demandConf = scoreZone(demand);
  const supplyConf = scoreZone(supply);

  return {
    demand:
      demand && demandConf >= 0.62
        ? { min: demand.min, max: demand.max, confidence: demandConf }
        : null,
    supply:
      supply && supplyConf >= 0.62
        ? { min: supply.min, max: supply.max, confidence: supplyConf }
        : null,
  };
}

export function analyzeTargetLevels({
  candles,
  timeframeDays = 30,
  target1,
  target2,
} = {}) {
  const data = normalizeCandles(candles);
  const tfDays = Number.isFinite(Number(timeframeDays)) ? Number(timeframeDays) : 30;

  const t1 = Number(target1);
  const t2 = Number(target2);

  if (data.length < 14) {
    return {
      ok: false,
      error: "Not enough candle data to run a stable target analysis.",
    };
  }

  if (!Number.isFinite(t1) || !Number.isFinite(t2)) {
    return {
      ok: false,
      error: "Two numeric target levels are required.",
    };
  }

  const closes = data.map((c) => c.close);
  const times = data.map((c) => c.time);
  const currentClose = closes[closes.length - 1];

  const atr = computeATR(data, 14);
  const atrPct = currentClose > 0 ? (atr / currentClose) * 100 : 0;
  const rsi = computeRSI(closes, 14);

  const lookback = clamp(Math.round(data.length * 0.22), 12, 60);
  const baseClose = closes[Math.max(0, closes.length - 1 - lookback)];
  const changePct = baseClose > 0 ? ((currentClose - baseClose) / baseClose) * 100 : 0;

  const reg = linearRegression(closes.slice(-Math.min(80, closes.length)));
  const slopeScore = reg ? clamp((reg.slope / Math.max(1e-9, mean(closes))) * 120, -1, 1) : 0;
  const momScore = clamp(changePct / 6.0, -1, 1);
  const rsiScore =
    typeof rsi === "number" ? clamp((rsi - 50) / 25, -1, 1) : 0;

  const directionScore = clamp(0.5 * momScore + 0.35 * slopeScore + 0.15 * rsiScore, -1, 1);
  const direction = directionFromScore(directionScore);

  const pivots = findPivots(data, 3, 3);
  const pivotPrices = [
    ...pivots.highs.map((p) => p.value),
    ...pivots.lows.map((p) => p.value),
  ];

  const tolerance = Math.max(atr * 0.4, currentClose * 0.0025);
  const clusters = clusterLevels(pivotPrices, tolerance);
  const levelsByDistance = clusters
    .map((c) => c.price)
    .filter(Number.isFinite)
    .sort((a, b) => Math.abs(a - currentClose) - Math.abs(b - currentClose));

  const supports = levelsByDistance.filter((p) => p < currentClose).slice(0, 4).sort((a, b) => a - b);
  const resistances = levelsByDistance.filter((p) => p > currentClose).slice(0, 4).sort((a, b) => a - b);

  const support = supports.length ? supports[supports.length - 1] : null;
  const resistance = resistances.length ? resistances[0] : null;

  const structure = (() => {
    const h = pivots.highs.slice(-3).map((p) => p.value);
    const l = pivots.lows.slice(-3).map((p) => p.value);
    if (h.length < 2 || l.length < 2) return "Mixed";

    const hh = h[h.length - 1] > h[h.length - 2];
    const hl = l[l.length - 1] > l[l.length - 2];
    const lh = h[h.length - 1] < h[h.length - 2];
    const ll = l[l.length - 1] < l[l.length - 2];

    if (hh && hl) return "Higher highs / higher lows";
    if (lh && ll) return "Lower highs / lower lows";
    if (hh && !hl) return "Higher highs, weak higher lows";
    if (!hh && hl) return "Higher lows, capped highs";
    if (lh && !ll) return "Lower highs, resilient lows";
    if (!lh && ll) return "Lower lows, mixed highs";
    return "Mixed";
  })();

  const sideFor = (target) => (target > currentClose ? "up" : target < currentClose ? "down" : "flat");

  const side1 = sideFor(t1);
  const side2 = sideFor(t2);
  const distAtr1 = atr > 0 ? Math.abs(t1 - currentClose) / atr : Infinity;
  const distAtr2 = atr > 0 ? Math.abs(t2 - currentClose) / atr : Infinity;

  const obstacleCountUp = (target) =>
    resistances.filter((r) => r > currentClose && r < target).length;
  const obstacleCountDown = (target) =>
    supports.filter((s) => s < currentClose && s > target).length;

  const prob1 = probabilityFromDistance({
    distAtr: distAtr1,
    tfDays,
    alignScore: side1 === "up" ? directionScore : side1 === "down" ? -directionScore : 0,
    obstacleCount: side1 === "up" ? obstacleCountUp(t1) : side1 === "down" ? obstacleCountDown(t1) : 0,
    atrPct,
  });

  const prob2 = probabilityFromDistance({
    distAtr: distAtr2,
    tfDays,
    alignScore: side2 === "up" ? directionScore : side2 === "down" ? -directionScore : 0,
    obstacleCount: side2 === "up" ? obstacleCountUp(t2) : side2 === "down" ? obstacleCountDown(t2) : 0,
    atrPct,
  });

  const suggestion = (() => {
    const primarySide =
      side1 === side2 ? side1 : Math.abs(t1 - currentClose) < Math.abs(t2 - currentClose) ? side1 : side2;
    if (primarySide !== "up" && primarySide !== "down") return null;

    const worstDist = Math.max(distAtr1, distAtr2);
    if (!Number.isFinite(worstDist) || worstDist < 4.5) return null;
    return buildTargetSuggestion({
      current: currentClose,
      atr,
      side: primarySide,
      levels: { supports, resistances },
    });
  })();

  const patterns = [];
  const triangle = detectTriangle({ pivots, currentClose, atr });
  if (triangle) patterns.push(triangle);
  const channel = detectChannel({ closes, times });
  if (channel) patterns.push(channel);
  const hs = detectHeadAndShoulders({ pivots, currentClose });
  if (hs) patterns.push(hs);
  const flag = detectFlag({ candles: data, atrPct });
  if (flag) patterns.push(flag);

  const zones = detectZones({ pivots, currentClose, tolerance });
  if (zones?.demand) {
    patterns.push({
      type: "Demand Zone",
      confidence: zones.demand.confidence,
      summary: "Pivot-low cluster with repeated reactions (demand).",
      overlays: {
        priceLines: [
          {
            key: "demand-top",
            price: zones.demand.max,
            color: "rgba(34,197,94,0.55)",
            title: "Demand",
            lineStyle: 2,
            lineWidth: 1,
          },
          {
            key: "demand-bottom",
            price: zones.demand.min,
            color: "rgba(34,197,94,0.55)",
            title: "",
            lineStyle: 2,
            lineWidth: 1,
          },
        ],
      },
    });
  }
  if (zones?.supply) {
    patterns.push({
      type: "Supply Zone",
      confidence: zones.supply.confidence,
      summary: "Pivot-high cluster with repeated reactions (supply).",
      overlays: {
        priceLines: [
          {
            key: "supply-top",
            price: zones.supply.max,
            color: "rgba(239,68,68,0.55)",
            title: "Supply",
            lineStyle: 2,
            lineWidth: 1,
          },
          {
            key: "supply-bottom",
            price: zones.supply.min,
            color: "rgba(239,68,68,0.55)",
            title: "",
            lineStyle: 2,
            lineWidth: 1,
          },
        ],
      },
    });
  }

  const patternConfidence = patterns.length ? Math.max(...patterns.map((p) => p.confidence || 0)) : 0;

  const primarySignal = (() => {
    const upTargets = [t1, t2].filter((x) => x > currentClose).length;
    const downTargets = [t1, t2].filter((x) => x < currentClose).length;

    const avgProbUp =
      upTargets === 0
        ? 0
        : mean([
            t1 > currentClose ? prob1 : null,
            t2 > currentClose ? prob2 : null,
          ].filter((v) => typeof v === "number"));
    const avgProbDown =
      downTargets === 0
        ? 0
        : mean([
            t1 < currentClose ? prob1 : null,
            t2 < currentClose ? prob2 : null,
          ].filter((v) => typeof v === "number"));

    if (upTargets === 2) {
      if (directionScore > 0.22 && prob1 > 0.55) return "Buy";
      return "No Trade";
    }
    if (downTargets === 2) {
      if (directionScore < -0.22 && prob1 > 0.55) return "Sell";
      return "No Trade";
    }

    if (avgProbUp - avgProbDown > 0.12 && directionScore > 0.15 && avgProbUp > 0.52) {
      return "Buy";
    }
    if (avgProbDown - avgProbUp > 0.12 && directionScore < -0.15 && avgProbDown > 0.52) {
      return "Sell";
    }
    return "No Trade";
  })();

  const risk = riskFromAtrPct(atrPct);
  const confidence = (() => {
    const base = 40 + Math.abs(directionScore) * 28 + Math.abs(changePct) * 1.2;
    const probs = 10 + Math.abs(prob1 - 0.5) * 28 + Math.abs(prob2 - 0.5) * 18;
    const pat = patternConfidence * 18;
    const penalty = risk === "High" ? 8 : 0;
    return Math.round(clamp(base + probs + pat - penalty, 8, 92));
  })();

  const baseTrendline = (() => {
    const windowLen = Math.min(60, closes.length);
    const startIndex = Math.max(0, closes.length - windowLen);
    const windowCloses = closes.slice(startIndex);
    const windowTimes = times.slice(startIndex);
    if (windowCloses.length < 2 || windowTimes.length < 2) return null;

    const r = linearRegression(windowCloses);
    if (!r) return null;

    const startVal = r.intercept;
    const endVal = r.intercept + r.slope * (windowCloses.length - 1);
    const color =
      directionScore >= 0 ? "rgba(34,197,94,0.48)" : "rgba(239,68,68,0.48)";

    return {
      key: "trend-base",
      color,
      width: 2,
      lineStyle: 0,
      points: [
        { time: windowTimes[0], value: startVal },
        { time: windowTimes[windowTimes.length - 1], value: endVal },
      ],
    };
  })();

  const overlays = {
    priceLines: [
      support
        ? { key: "support", price: support, color: "rgba(34,197,94,0.70)", title: "Support", lineStyle: 2 }
        : null,
      resistance
        ? { key: "resistance", price: resistance, color: "rgba(239,68,68,0.70)", title: "Resistance", lineStyle: 2 }
        : null,
      { key: "target-1", price: t1, color: "rgba(251,191,36,0.95)", title: "T1", lineStyle: 0 },
      { key: "target-2", price: t2, color: "rgba(167,139,250,0.95)", title: "T2", lineStyle: 0 },
      ...patterns.flatMap((p) => p?.overlays?.priceLines || []),
    ].filter(Boolean),
    trendlines: [baseTrendline, ...patterns.flatMap((p) => p?.overlays?.trendlines || [])].filter(
      Boolean,
    ),
  };

  const summary = [
    `${direction} bias (${structure}).`,
    `Trend ${formatPct(changePct, 2)} | ATR ${formatPct(atrPct, 2)} | RSI ${typeof rsi === "number" ? rsi.toFixed(0) : "--"}.`,
    support && resistance
      ? `Key levels: support ~${support.toFixed(2)} / resistance ~${resistance.toFixed(2)}.`
      : "Key levels: support/resistance not stable yet.",
  ].join(" ");

  return {
    ok: true,
    signal: primarySignal,
    confidence,
    risk,
    direction,
    summary,
    targets: {
      target1: t1,
      target2: t2,
      suggestion,
    },
    probabilities: {
      target1: prob1,
      target2: prob2,
    },
    diagnostics: {
      currentClose,
      changePct,
      atr,
      atrPct,
      rsi,
      directionScore,
      structure,
      supports,
      resistances,
      distAtr1,
      distAtr2,
    },
    patterns: patterns.map((p) => ({
      type: p.type,
      confidence: p.confidence,
      summary: p.summary,
    })),
    overlays,
  };
}
