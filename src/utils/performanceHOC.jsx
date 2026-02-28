import React, { useEffect, useRef } from 'react';

export function withPerformanceMonitor(WrappedComponent, componentName = 'Component') {
    return (props) => {
        const renderCount = useRef(0);
        const lastRender = useRef(performance.now());

        useEffect(() => {
            const now = performance.now();
            const diff = now - lastRender.current;
            renderCount.current++;

            if (diff > 16) { // Warn if slower than 60fps
                console.warn(`[Slow Render] ${componentName}: ${diff.toFixed(2)}ms`);
            }

            lastRender.current = now;
        });

        return <WrappedComponent {...props} />;
    };
}
