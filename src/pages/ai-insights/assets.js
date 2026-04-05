// Legacy re-export layer for AI Insights assets.
// The single source of truth is now `src/assets/assetCatalog.js`.

import {
  DEFAULT_INSTRUMENT_ID,
  formatInstrumentPairLabel,
  getChartSupportedInstruments,
  getInstrumentById,
} from "../../assets/assetCatalog";

export const AI_INSIGHTS_ASSETS = getChartSupportedInstruments();
export const DEFAULT_AI_INSIGHTS_ASSET_ID = DEFAULT_INSTRUMENT_ID;
export const getAIInsightsAssetById = getInstrumentById;
export const formatAssetPairLabel = formatInstrumentPairLabel;
