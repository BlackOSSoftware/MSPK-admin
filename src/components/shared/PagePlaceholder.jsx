import React from 'react';
import Card from '../../components/ui/Card';

const PagePlaceholder = ({ title, module }) => {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {title}
            </h1>
            <Card className="min-h-[400px] flex items-center justify-center border-dashed border-white/10 bg-white/5">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-medium text-white">Development in Progress</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        The <span className="text-primary font-mono">{module}</span> module is currently being built.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default PagePlaceholder;
