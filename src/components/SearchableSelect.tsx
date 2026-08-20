'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string | number;
}

interface SearchableSelectProps {
    options: (string | SelectOption)[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    name?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = '--चुनें--',
    searchPlaceholder = 'खोजें...',
    style,
    disabled = false,
    name
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Normalize options into { label, value }
    const normalizedOptions: SelectOption[] = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return opt;
        }
        return { label: String(opt), value: String(opt) };
    });

    const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));
    const selectedLabel = selectedOption ? selectedOption.label : placeholder;

    // Filter options based on search query
    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(opt.value).toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
            {/* Clickable Select Box */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '12px 34px 12px 14px',
                    borderRadius: '14px',
                    border: isOpen ? '1px solid #6366F1' : '1px solid #E2E8F0',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#334155',
                    background: disabled ? '#F1F5F9' : '#F8FAFC',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLabel}
                </span>
                <ChevronDown
                    size={16}
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
                        transition: 'transform 0.2s ease',
                        color: '#64748B',
                        pointerEvents: 'none'
                    }}
                />
            </div>

            {/* Dropdown Popup */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        minWidth: '220px',
                        maxHeight: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'fadeIn 0.15s ease-out'
                    }}
                >
                    {/* Top Search Input */}
                    <div style={{ padding: '10px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 30px 8px 32px',
                                borderRadius: '10px',
                                border: '1px solid #CBD5E1',
                                fontSize: '13px',
                                outline: 'none',
                                background: '#FFFFFF',
                                color: '#0F172A'
                            }}
                        />
                        {searchQuery && (
                            <X
                                size={14}
                                onClick={() => setSearchQuery('')}
                                style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', cursor: 'pointer' }}
                            />
                        )}
                    </div>

                    {/* Scrollable Option List */}
                    <div style={{ overflowY: 'auto', maxHeight: '240px', padding: '6px' }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#94A3B8' }}>
                                कोई विकल्प नहीं मिला
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <div
                                        key={String(opt.value)}
                                        onClick={() => {
                                            onChange(String(opt.value));
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: isSelected ? '700' : '500',
                                            color: isSelected ? '#4338CA' : '#334155',
                                            background: isSelected ? '#EEF2FF' : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {opt.label}
                                        </span>
                                        {isSelected && <Check size={14} color="#4338CA" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
