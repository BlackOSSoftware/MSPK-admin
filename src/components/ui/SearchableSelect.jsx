import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Check, Plus as PlusIcon } from 'lucide-react'; // Added Plus

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    className = "",
    buttonClassName = "",
    dropdownClassName = "",
    disabled = false,
    searchable = true,
    variant = "compact", // "compact" | "standard"
    onSearchChange, // Callback for parent to handle dynamic searches
    allowCustom = false, // New Prop
    multiple = false // Fix: Add multiple prop
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search (Skip if parent is handling dynamic search)
    const filteredOptions = onSearchChange
        ? options
        : options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const selectedOption = options.find(opt => opt.value === value);

    const variants = {
        compact: "px-2 py-1.5 text-[10px] bg-card border border-border rounded hover:border-primary/50",
        standard: "px-4 py-2.5 text-sm bg-card border border-input rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
    };

    const activeRingColors = {
        compact: "border-primary ring-1 ring-primary/20",
        standard: "border-primary/50 ring-2 ring-primary/30"
    };

    return (
        <div className={`relative ${isOpen ? 'z-50' : ''} ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between gap-2 transition-all duration-200
                    ${variants[variant] || variants.compact}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${isOpen ? (activeRingColors[variant] || activeRingColors.compact) : (variant === 'standard' ? 'group-hover:border-border' : '')}
                    ${buttonClassName}
                `}
            >
                <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
                    {multiple && Array.isArray(value) && value.length > 0 ? (
                        value.map(val => (
                            <span key={val} className="text-[10px] bg-primary/20 text-primary px-1 rounded flex items-center gap-1">
                                {options.find(o => o.value === val)?.label || val}
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newVal = value.filter(v => v !== val);
                                        onChange(newVal);
                                    }}
                                    className="hover:text-red-500 cursor-pointer"
                                ><X size={10} /></span>
                            </span>
                        ))
                    ) : (
                        <span className={`truncate ${(selectedOption || value) ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {multiple ? (value?.length ? `${value.length} Selected` : placeholder) : (selectedOption ? selectedOption.label : (value || placeholder))}
                        </span>
                    )}
                </div>
                <ChevronDown size={variant === 'standard' ? 16 : 14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className={`
                    absolute z-50 mt-1 w-full bg-card border border-border rounded overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top shadow-xl
                    ${dropdownClassName}
                `}>
                    {/* Search ... */}
                    {searchable && (
                        <div className="p-2 border-b border-border bg-card sticky top-0">
                            {/* ... Search Input Code ... */}
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (onSearchChange) onSearchChange(e.target.value);
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="w-full bg-card border border-border rounded pl-8 pr-8 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = multiple ? value?.includes(option.value) : value === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            if (multiple) {
                                                const current = Array.isArray(value) ? value : [];
                                                const newVal = current.includes(option.value)
                                                    ? current.filter(v => v !== option.value)
                                                    : [...current, option.value];
                                                onChange(newVal);
                                                // Don't close on multiple select
                                            } else {
                                                onChange(option.value);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                                if (onSearchChange) onSearchChange('');
                                            }
                                        }}
                                        className={`
                                            w-full text-left px-3 py-2 text-xs rounded flex items-center justify-between
                                            hover:bg-primary/10 hover:text-primary transition-colors
                                            ${isSelected ? 'bg-primary/20 text-primary font-medium' : 'text-foreground hover:bg-muted'}
                                        `}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground bg-muted/30 rounded-md m-1 border border-border">
                                {searchTerm.length > 0 && searchTerm.length < 2 ? "Type at least 2 characters..." : "No instruments found."}
                            </div>
                        )}

                        {/* Custom Value Option */}
                        {allowCustom && searchTerm.length > 1 && !filteredOptions.find(o => o.label === searchTerm) && (
                            <button
                                onClick={() => {
                                    const val = searchTerm.toUpperCase();
                                    if (multiple) {
                                        const current = Array.isArray(value) ? value : [];
                                        if (!current.includes(val)) onChange([...current, val]);
                                        setSearchTerm('');
                                    } else {
                                        onChange(val);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }
                                }}
                                className="w-full text-left px-3 py-2 text-xs rounded flex items-center gap-2 text-blue-400 hover:bg-blue-500/10 border-t border-white/5 mt-1"
                            >
                                <PlusIcon size={12} />
                                <span>Use "{searchTerm.toUpperCase()}"</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
