class MobileAdaptiveChart {
    constructor() {
        this.userAgent = navigator.userAgent || '';
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(this.userAgent) || (window.innerWidth < 768);
        
        // Defaults
        this.config = {
            maxVisibleCandles: this.isMobile ? 100 : 500, // Reduced for mobile
            bufferSize: this.isMobile ? 500 : 5000,
            fpsLimit: this.isMobile ? 30 : 60,
            enableAnimations: !this.isMobile,
            indicatorPrecision: this.isMobile ? 2 : 4 // Reduce math load
        };

        this.networkInfo = {
            type: 'unknown',
            saveData: false,
            rtt: 0
        };

        this.battery = null;

        this._initListeners();
    }

    async _initListeners() {
        // Network
        if (navigator.connection) {
            this._updateNetwork(navigator.connection);
            navigator.connection.addEventListener('change', () => {
                this._updateNetwork(navigator.connection);
            });
        }

        // Battery
        if (navigator.getBattery) {
            try {
                this.battery = await navigator.getBattery();
                this.battery.addEventListener('levelchange', this._handleBattery.bind(this));
                this._handleBattery();
            } catch (e) {
                // Ignore
            }
        }
    }

    _updateNetwork(conn) {
        this.networkInfo = {
            type: conn.effectiveType || '4g', // 'slow-2g', '2g', '3g', '4g'
            saveData: conn.saveData || false,
            rtt: conn.rtt || 0
        };
        
        // Dynamic Adjustment based on Network
        if (this.networkInfo.type === '3g' || this.networkInfo.type === '2g') {
            this.config.bufferSize = 200; // Drastically reduce fetch size
        }
    }

    _handleBattery() {
        if (!this.battery) return;
        // If battery < 20% and not charging, throttle hard
        if (this.battery.level < 0.2 && !this.battery.charging) {
            this.config.fpsLimit = 15;
            this.config.enableAnimations = false;
        } else if (this.isMobile) {
            this.config.fpsLimit = 30;
        }
    }

    getConfig() {
        return this.config;
    }

    shouldThrottle() {
        if (this.networkInfo.saveData) return true;
        if (this.battery && this.battery.level < 0.15 && !this.battery.charging) return true;
        return false;
    }

    getFetchLimit() {
        // Return number of candles to fetch
        if (this.isMobile) {
            if (this.networkInfo.type === '4g') return 500;
            return 200; // 3G/Slow
        }
        return 2000; // Desktop
    }
}

export const mobileOptimizer = new MobileAdaptiveChart();
export default mobileOptimizer;
