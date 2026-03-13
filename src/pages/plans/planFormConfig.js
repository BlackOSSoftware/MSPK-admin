export const PLAN_TYPE_OPTIONS = [
  { label: 'Premium (Paid)', value: 'premium' },
  { label: 'Demo (Trial / Free)', value: 'demo' },
  { label: 'Custom (Admin Created)', value: 'custom' },
];

export const STANDARD_FEATURES = [
  { id: 'Intraday Equity', label: 'Intraday Equity', category: 'Equity' },
  { id: 'Delivery / Swing', label: 'Delivery / Swing', category: 'Equity' },
  { id: 'Nifty Options', label: 'Nifty Options', category: 'FNO' },
  { id: 'BankNifty Options', label: 'BankNifty Options', category: 'FNO' },
  { id: 'FinNifty Options', label: 'FinNifty Options', category: 'FNO' },
  { id: 'Stock Options', label: 'Stock Options', category: 'FNO' },
  { id: 'MCX Futures', label: 'MCX Futures', category: 'Commodity' },
  { id: 'Currency', label: 'Currency', category: 'Forex' },
  { id: 'BTST Calls', label: 'BTST Calls', category: 'Special' },
  { id: 'Hero Zero Trades', label: 'Hero Zero Trades', category: 'Special' },
];

export const buildPlanSegmentOptions = (segments = []) => {
  const uniqueSegments = Array.from(
    new Map(
      (Array.isArray(segments) ? segments : []).map((segment) => [
        String(segment?.code || segment?.segment_code || '').trim().toUpperCase(),
        {
          label: segment?.name || segment?.code || segment?.segment_code || 'Unknown',
          value: String(segment?.code || segment?.segment_code || '').trim().toUpperCase(),
        },
      ])
    ).values()
  ).filter((segment) => segment.value);

  return [{ label: 'All Segments', value: 'ALL' }, ...uniqueSegments];
};

export const normalizePlanSegmentSelection = (values = [], options = [], previousValues = []) => {
  const normalizedValues = Array.from(
    new Set(
      (Array.isArray(values) ? values : [values])
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );
  const previousNormalizedValues = Array.from(
    new Set(
      (Array.isArray(previousValues) ? previousValues : [previousValues])
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );

  if (normalizedValues.includes('ALL')) {
    if (previousNormalizedValues.includes('ALL') && normalizedValues.length > 1) {
      return normalizedValues.filter((value) => value !== 'ALL');
    }
    return ['ALL'];
  }

  const realOptionValues = options
    .map((option) => option?.value)
    .filter((value) => value && value !== 'ALL');

  if (realOptionValues.length > 0 && realOptionValues.every((value) => normalizedValues.includes(value))) {
    return ['ALL'];
  }

  return normalizedValues;
};

export const splitPlanFeatures = (features = []) => {
  const standardFeatureIds = STANDARD_FEATURES.map((feature) => feature.id);
  const selectedStandard = [];
  const selectedCustom = [];

  (Array.isArray(features) ? features : []).forEach((feature) => {
    if (standardFeatureIds.includes(feature)) {
      selectedStandard.push(feature);
    } else {
      selectedCustom.push(feature);
    }
  });

  return {
    selectedStandard,
    selectedCustom,
  };
};
