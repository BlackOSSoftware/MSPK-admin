import React from 'react';

const SkeletonCard = () => (
    <div className="dashboard-surface soft-shadow h-full bg-card/90 border border-border/70 rounded-2xl p-4 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-start">
            <div className="w-20 h-3 bg-muted rounded"></div>
            <div className="w-10 h-3 bg-muted rounded"></div>
        </div>
        <div className="mt-4 space-y-2">
            <div className="w-32 h-8 bg-muted rounded"></div>
            <div className="w-16 h-3 bg-muted rounded"></div>
        </div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div className="space-y-4 flex flex-col h-auto lg:h-full lg:overflow-hidden pb-4 lg:pb-0">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 h-auto shrink-0">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:pb-2">
                {/* Left Column: Graph & Orders (8/12) */}
                <div className="lg:col-span-9 flex flex-col gap-3 h-auto lg:h-full lg:min-h-0">
                    {/* Revenue Graph Skeleton */}
                    <div className="dashboard-surface soft-shadow h-72 lg:h-auto lg:flex-1 lg:min-h-0 bg-card/90 border border-border/70 rounded-2xl animate-pulse relative overflow-hidden">
                        <div className="h-12 border-b border-border/70 bg-secondary/30 px-4 flex items-center justify-between">
                            <div className="w-32 h-4 bg-muted rounded"></div>
                            <div className="w-6 h-6 bg-muted rounded"></div>
                        </div>
                        <div className="p-6">
                            <div className="w-48 h-10 bg-muted rounded mb-4"></div>
                            <div className="w-full h-40 bg-muted/50 rounded-lg"></div>
                        </div>
                    </div>
                    {/* Recent Orders Skeleton */}
                    <div className="dashboard-surface soft-shadow h-64 lg:h-56 shrink-0 bg-card/90 border border-border/70 rounded-2xl animate-pulse">
                        <div className="h-10 border-b border-border/70 bg-secondary/30 px-4 flex items-center justify-between">
                            <div className="w-32 h-3 bg-muted rounded"></div>
                            <div className="w-16 h-3 bg-muted rounded"></div>
                        </div>
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="w-16 h-3 bg-muted rounded"></div>
                                    <div className="w-24 h-3 bg-muted rounded"></div>
                                    <div className="w-16 h-3 bg-muted rounded"></div>
                                    <div className="w-16 h-3 bg-muted rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Activity & Quick Actions (4/12) */}
                <div className="lg:col-span-3 flex flex-col gap-3 h-auto lg:h-full lg:min-h-0">
                    {/* Activity Log Skeleton */}
                    <div className="dashboard-surface soft-shadow h-80 lg:h-auto lg:flex-1 lg:min-h-0 bg-card/90 border border-border/70 rounded-2xl animate-pulse">
                        <div className="h-10 border-b border-border/70 bg-secondary/30 px-4 flex items-center justify-between">
                            <div className="w-24 h-3 bg-muted rounded"></div>
                        </div>
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 bg-muted rounded-full shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="w-full h-3 bg-muted rounded"></div>
                                        <div className="w-1/2 h-2 bg-muted rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Quick Actions Skeleton */}
                    <div className="dashboard-surface soft-shadow h-auto lg:h-48 shrink-0 bg-card/90 border border-border/70 rounded-2xl animate-pulse">
                        <div className="h-9 border-b border-border/70 bg-secondary/30 px-4 flex items-center">
                            <div className="w-24 h-3 bg-muted rounded"></div>
                        </div>
                        <div className="p-2 grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-16 bg-muted/20 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
