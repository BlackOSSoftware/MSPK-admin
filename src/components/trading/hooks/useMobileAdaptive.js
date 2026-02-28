import { useState, useEffect } from 'react';
import { mobileOptimizer } from '../../../utils/mobile/MobileAdaptiveChart';

export const useMobileAdaptive = () => {
    const [config, setConfig] = useState(mobileOptimizer.getConfig());
    const [networkInfo, setNetworkInfo] = useState(mobileOptimizer.networkInfo);
    
    useEffect(() => {
        const handleResize = () => {
            // Re-eval mobile status on resize (e.g. tablet rotation)
            mobileOptimizer.isMobile = (window.innerWidth < 768);
            setConfig({ ...mobileOptimizer.getConfig() });
        };

        window.addEventListener('resize', handleResize);
        
        // Optional: Polling for Battery/Network if we really care about dynamic adaptation
        const interval = setInterval(() => {
            const newConfig = mobileOptimizer.getConfig();
            const newNet = mobileOptimizer.networkInfo;
            
            // Simple deep check or just set
            if (JSON.stringify(newNet) !== JSON.stringify(networkInfo)) {
                setNetworkInfo(newNet);
                setConfig(newConfig);
            }
        }, 5000);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearInterval(interval);
        };
    }, [networkInfo]);

    return {
        ...config,
        networkInfo,
        shouldThrottle: mobileOptimizer.shouldThrottle(),
        isMobile: mobileOptimizer.isMobile
    };
};
