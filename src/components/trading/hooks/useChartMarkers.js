import { useEffect, useRef } from 'react';

export const useChartMarkers = ({ seriesRef, signalMarkers, indicatorMarkers }) => {
    const prevMarkersRef = useRef(null);
    useEffect(() => {
        if (!seriesRef.current) return;

        // Combine Signal + Indicator Markers
        const allMarkers = [...(signalMarkers || []), ...(indicatorMarkers || [])];

        // Lightweight Charts expects markers sorted by time (ascending)
        // signalMarkers should already be sorted from parent, but sorting here adds safety.
        // Also ensure time is a number.
        const sortedMarkers = allMarkers.sort((a, b) => a.time - b.time);

        // Simple Deep Comparison to avoid re-setting identical markers
        const markersStr = JSON.stringify(sortedMarkers);
        if (prevMarkersRef.current === markersStr) {
            return;
        }
        prevMarkersRef.current = markersStr;

        // console.log("DEBUG: Setting Chart Markers", sortedMarkers.length);

        try {
            seriesRef.current.setMarkers(sortedMarkers);
        } catch (e) {
            console.error("Failed to set chart markers", e);
        }

    }, [seriesRef.current, signalMarkers, indicatorMarkers]);
};
