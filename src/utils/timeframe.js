export const normalizeSignalTimeframe = (value) => {
    if (value === null || value === undefined) return '';

    const raw = String(value).trim();
    if (!raw) return '';

    const normalized = raw.toUpperCase();

    if (normalized === 'S' || normalized === 'SCALP') return 'Scalp';
    if (/^\d+S$/.test(normalized)) return `${Number.parseInt(normalized, 10)}s`;
    if (/^\d+M$/.test(normalized)) return `${Number.parseInt(normalized, 10)}m`;
    if (/^\d+H$/.test(normalized)) return `${Number.parseInt(normalized, 10)}h`;
    if (['D', '1D', 'DAY'].includes(normalized)) return '1D';
    if (['W', '1W', 'WEEK'].includes(normalized)) return '1W';
    if (['M', '1M', 'MO', 'MON', 'MN', 'MONTH', '1MO', '1MON', '1MONTH'].includes(normalized)) {
        return '1M';
    }

    if (/^\d+$/.test(normalized)) {
        const amount = Number(normalized);
        if (!Number.isFinite(amount) || amount <= 0) return raw;
        if (amount < 60) return `${amount}m`;
        if (amount < 1440 && amount % 60 === 0) return `${amount / 60}h`;
        if (amount === 1440) return '1D';
        if (amount === 10080) return '1W';
        if (amount === 43200) return '1M';
        return `${amount}m`;
    }

    return raw;
};

export const matchesSignalTimeframe = (signalTimeframe, activeTimeframe) => {
    const left = normalizeSignalTimeframe(signalTimeframe);
    const right = normalizeSignalTimeframe(activeTimeframe);
    return Boolean(left) && Boolean(right) && left === right;
};

export const snapSignalTimeToResolution = (value, resolution) => {
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return null;

    const normalizedResolution = normalizeSignalTimeframe(resolution);
    const time = timestamp / 1000;

    if (normalizedResolution === '1D') {
        const date = new Date(time * 1000);
        date.setUTCHours(0, 0, 0, 0);
        return date.getTime() / 1000;
    }

    if (normalizedResolution === '1W') {
        const date = new Date(time * 1000);
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
        date.setUTCDate(diff);
        date.setUTCHours(0, 0, 0, 0);
        return date.getTime() / 1000;
    }

    if (normalizedResolution === '1M') {
        const date = new Date(time * 1000);
        date.setUTCDate(1);
        date.setUTCHours(0, 0, 0, 0);
        return date.getTime() / 1000;
    }

    const minuteMatch = normalizedResolution.match(/^(\d+)m$/i);
    if (minuteMatch) {
        const seconds = Number(minuteMatch[1]) * 60;
        return Math.floor(time - (time % seconds));
    }

    const hourMatch = normalizedResolution.match(/^(\d+)h$/i);
    if (hourMatch) {
        const seconds = Number(hourMatch[1]) * 60 * 60;
        return Math.floor(time - (time % seconds));
    }

    return Math.floor(time);
};
