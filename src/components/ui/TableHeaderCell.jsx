import React from 'react';
import { clsx } from 'clsx';

const TableHeaderCell = ({ icon: Icon, label, className, align = 'left' }) => {
    const alignment = align === 'center' ? 'justify-center w-full' : align === 'right' ? 'justify-end w-full' : '';

    return (
        <th className={className}>
            <span className={clsx("inline-flex items-center gap-1.5", alignment)}>
                {Icon && <Icon size={12} className="text-primary/70" />}
                <span>{label}</span>
            </span>
        </th>
    );
};

export default TableHeaderCell;
