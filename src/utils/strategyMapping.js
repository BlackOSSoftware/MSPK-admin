import { v4 as uuidv4 } from 'uuid';

/**
 * Maps a Strategy Configuration object to a list of Chart Indicators.
 * @param {Object} strategy - The strategy configuration object from DB
 * @returns {Array} List of indicator objects compatible with TradingChart
 */
export const mapStrategyToIndicators = (strategy) => {
    if (!strategy || !strategy.logic || !strategy.logic.rules) return [];

    const indicators = [];

    strategy.logic.rules.forEach((rule, index) => {
        // Generate a stable but unique ID for the strategy indicator
        // We use the strategy ID + index to ensure it doesn't flicker on re-renders,
        // but different enough if rules change.
        // Actually, for chart indicators, we usually use UUID.
        // But to prevent re-creating series on every render, we need stability.
        // Let's use `STRAT_${strategy._id}_${index}` as UUID.
        
        const baseUuid = `STRAT_${strategy._id || strategy.id}_${index}`;
        
        // 1. Supertrend
        if (rule.indicator === 'Supertrend' || (rule.condition && rule.condition.includes('Supertrend'))) {
            // Extract Params
            const period = rule.params?.period || 14;
            const multiplier = rule.params?.multiplier || 1.5; // Changed default from 3 to 1.5 as per user screenshot/request usually
            // User screenshot showed 14 / 1.5
            
            indicators.push({
                uuid: `${baseUuid}_ST`,
                id: 'Supertrend',
                name: `Supertrend (${period}, ${multiplier})`,
                period: period,
                multiplier: multiplier,
                color: '#2962FF', // Default, chart handles up/down colors
                isStrategy: true, // Flag to identify and remove later
                strategyId: strategy._id || strategy.id
            });
        }

        // 2. PSAR
        else if (rule.indicator === 'PSAR' || (rule.condition && rule.condition.includes('PSAR'))) {
            indicators.push({
                uuid: `${baseUuid}_PSAR`,
                id: 'PSAR',
                name: 'PSAR',
                period: 0.02, // Default start/step
                max: 0.2,
                color: '#E91E63',
                isStrategy: true,
                strategyId: strategy._id || strategy.id
            });
        }

        // 3. Market Structure (HH/LL)
        else if (rule.indicator === 'Structure' || (rule.condition && rule.condition.includes('Structure')) || (rule.condition && rule.condition.includes('HH_HL'))) {
            indicators.push({
                uuid: `${baseUuid}_HHLL`,
                id: 'HHLL',
                name: 'Market Structure',
                period: rule.params?.depth || 10, // Default depth 10 for cleaner zigzag
                color: 'rgba(245, 127, 23, 0.4)', // Subtle Orange
                upColor: 'rgba(16, 185, 129, 0.8)',
                downColor: 'rgba(239, 68, 68, 0.8)',
                showLabels: true,
                showLines: true,
                isStrategy: true,
                strategyId: strategy._id || strategy.id
            });
        }

        // 4. RSI
        else if (rule.indicator === 'RSI' || (rule.condition && rule.condition.includes('RSI'))) {
            indicators.push({
                uuid: `${baseUuid}_RSI`,
                id: 'RSI',
                name: `RSI (${rule.params?.period || 14})`,
                period: rule.params?.period || 14,
                color: '#9C27B0',
                isStrategy: true,
                strategyId: strategy._id || strategy.id
            });
        }
        
        // 5. EMA/SMA (If explicit)
        else if (rule.indicator === 'EMA') {
             indicators.push({
                uuid: `${baseUuid}_EMA`,
                id: 'EMA',
                name: `EMA (${rule.params?.period || 20})`,
                period: rule.params?.period || 20,
                color: '#FB8C00',
                isStrategy: true,
                strategyId: strategy._id || strategy.id
            });
        }
    });

    // 6. Strategy Trigger Labels (Visual Buy/Sell)
    if (strategy.name === 'Hybrid Strategy') {
        const st = indicators.find(i => i.id === 'Supertrend');
        indicators.push({
            uuid: `STRAT_${strategy._id || strategy.id}_SIGNALS`,
            id: 'Signals',
            name: 'Hybrid Signals',
            period: st?.period || 14,
            multiplier: st?.multiplier || 1.5,
            isStrategy: true,
            strategyId: strategy._id || strategy.id
        });
    }

    return indicators;
};
