'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    label: string;
    placeholder?: string;
    tags: string[];
    onChange: (tags: string[]) => void;
}

export default function TagInput({ label, placeholder, tags, onChange }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ',' || e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const trimmedValue = inputValue.trim().replace(/,$/g, '');
        if (trimmedValue && !tags.includes(trimmedValue)) {
            onChange([...tags, trimmedValue]);
            setInputValue('');
        }
    };

    const removeTag = (indexToRemove: number) => {
        onChange(tags.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div style={{ marginBottom: '24px' }}>
            <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '800',
                color: '#1E293B',
                marginBottom: '8px'
            }}>
                {label}
            </label>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={placeholder || 'टाइप करें और comma दबाएं...'}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlurCapture={(e) => e.target.style.borderColor = '#E2E8F0'}
            />

            {tags.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '12px'
                }}>
                    {tags.map((tag, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                border: '1px solid #93C5FD',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#1E40AF'
                            }}
                        >
                            <span>{tag}</span>
                            <button
                                onClick={() => removeTag(index)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#60A5FA'
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
