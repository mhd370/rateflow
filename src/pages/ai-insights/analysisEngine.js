function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function mean(nums) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function stdev(nums) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance = nums.reduce((acc, n) => acc + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function computeMaxDrawdownPct(closes) {
  let peak = -Infinity;
  let maxDrawdown = 0;

  for (const close of closes) {
    const c = Number(close);
    if (!Number.isFinite(c)) continue;

    if (c > peak) peak = c;
    if (peak <= 0) continue;

    const dd = ((peak - c) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return maxDrawdown;
}

function computeUpMoveRatio(returnsPct) {
  if (!returnsPct.length) return 0.5;
  const up = returnsPct.filter((r) => r > 0).length;
  return up / returnsPct.length;
}

function formatSignedPct(n, digits = 2) {
  if (!Number.isFinite(n)) return "--";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function safeSliceTail(arr, len) {
  if (!Array.isArray(arr) || !arr.length) return [];
  const start = Math.max(0, arr.length - len);
  return arr.slice(start);
}

export function analyzeMarketCandles({ candles, timeframeDays } = {}) {
  const cleanCandles = Array.isArray(candles)
    ? candles
        .map((c) => ({
          time: Number(c?.time),
          open: Number(c?.open),
          high: Number(c?.high),
          low: Number(c?.low),
          close: Number(c?.close),
        }))
        .filter(
          (c) =>
            Number.isFinite(c.time) &&
            [c.open, c.high, c.low, c.close].every(Number.isFinite),
        )
        .sort((a, b) => a.time - b.time)
    : [];

  const points = cleanCandles.length;
  const tfDays = Number.isFinite(Number(timeframeDays)) ? Number(timeframeDays) : 30;

  if (points < 8) {
    return {
      direction: "Neutral",
      confidence: 20,
      risk: "Medium",
      explanation:
        "Not enough market data points to compute a stable directional reading yet.",
      scenarioSummary: {
        base: "Wait for more data to build a reliable short-term read.",
        bull: "—",
        bear: "—",
      },
      signals: {
        points,
        timeframeDays: tfDays,
      },
    };
  }

  const closes = cleanCandles.map((c) => c.close);

  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];

  let periodHigh = -Infinity;
  let periodLow = Infinity;
  for (const c of cleanCandles) {
    if (c.high > periodHigh) periodHigh = c.high;
    if (c.low < periodLow) periodLow = c.low;
  }

  const overallChangePct =
    firstClose > 0 ? ((lastClose - firstClose) / firstClose) * 100 : 0;
  const rangePct = lastClose > 0 ? ((periodHigh - periodLow) / lastClose) * 100 : 0;

  const returnsPct = [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev === 0) continue;
    returnsPct.push(((curr - prev) / prev) * 100);
  }

  const momentumWindow = clamp(Math.round(points * 0.18), 8, 48);
  const momentumIndex = Math.max(0, points - 1 - momentumWindow);
  const momentumBase = closes[momentumIndex];
  const momentumChangePct =
    momentumBase && Number.isFinite(momentumBase)
      ? ((lastClose - momentumBase) / momentumBase) * 100
      : 0;

  const recentReturns = safeSliceTail(returnsPct, Math.max(6, momentumWindow - 1));
  const upMoveRatio = computeUpMoveRatio(recentReturns);
  const consistency = Math.abs(upMoveRatio - 0.5) * 2;

  const volatilityStdevPct = stdev(recentReturns);
  const maxDrawdownPct = computeMaxDrawdownPct(closes);

  const scale = Math.max(0.75, rangePct || 0);
  const trendThreshold = Math.max(0.25, scale * 0.12);
  const momentumThreshold = Math.max(0.18, scale * 0.07);

  const trendScore = clamp(overallChangePct / trendThreshold, -2, 2);
  const momScore = clamp(momentumChangePct / momentumThreshold, -2, 2);
  const consistencyScore = clamp((upMoveRatio - 0.5) * 2, -1, 1);

  const compositeRaw = 0.55 * trendScore + 0.35 * momScore + 0.1 * consistencyScore;
  const composite = clamp(compositeRaw / 2, -1, 1);

  const direction =
    composite > 0.22 ? "Bullish" : composite < -0.22 ? "Bearish" : "Neutral";

  const dataScore = clamp(Math.log10(points) / 2, 0, 1);
  let confidence = Math.round(
    clamp(24 + Math.abs(composite) * 58 + consistency * 14 + dataScore * 6, 5, 97),
  );

  if (direction === "Neutral") confidence = Math.min(confidence, 72);

  const sqrtDays = Math.sqrt(Math.max(1, tfDays));
  const lowRangeThreshold = 2.0 * sqrtDays;
  const highRangeThreshold = 5.0 * sqrtDays;

  const risk =
    rangePct >= highRangeThreshold || maxDrawdownPct >= highRangeThreshold * 0.85
      ? "High"
      : rangePct >= lowRangeThreshold || maxDrawdownPct >= lowRangeThreshold * 0.85
        ? "Medium"
        : "Low";

  const levelWindow = clamp(Math.round(points * 0.28), 18, 120);
  const recent = cleanCandles.slice(Math.max(0, points - levelWindow));
  let recentHigh = -Infinity;
  let recentLow = Infinity;
  for (const c of recent) {
    if (c.high > recentHigh) recentHigh = c.high;
    if (c.low < recentLow) recentLow = c.low;
  }

  const support = recentLow;
  const resistance = recentHigh;

  const baseScenario =
    direction === "Neutral"
      ? "Base case: consolidation continues between recent support and resistance while momentum stays mixed."
      : direction === "Bullish"
        ? "Base case: bullish bias persists, but expect pullbacks as price retests recent levels."
        : "Base case: bearish bias persists, but short squeezes/pullbacks can occur near support."

  const bullScenario =
    "Bull case: a sustained break above the recent swing high (resistance) could signal continuation. (Directional read, not a guaranteed forecast.)";

  const bearScenario =
    "Bear case: a sustained break below the recent swing low (support) could open further downside. (Directional read, not a guaranteed forecast.)";

  const explanation =
    `Rule-based read from recent price action over ~${tfDays} day(s): ` +
    `${direction} bias with ${confidence}% confidence. ` +
    `Trend: ${formatSignedPct(overallChangePct)}; momentum: ${formatSignedPct(
      momentumChangePct,
    )}; range volatility: ${rangePct.toFixed(2)}%. ` +
    "This is directional analysis, not a prediction.";

  return {
    direction,
    confidence,
    risk,
    explanation,
    scenarioSummary: {
      base: baseScenario,
      bull: bullScenario,
      bear: bearScenario,
    },
    signals: {
      points,
      timeframeDays: tfDays,
      lastClose,
      overallChangePct,
      momentumChangePct,
      rangePct,
      maxDrawdownPct,
      upMoveRatio,
      volatilityStdevPct,
      support,
      resistance,
    },
  };
}
