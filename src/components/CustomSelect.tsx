import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  badgeBg?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CustomSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  className = '',
  size = 'md',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 text-xs sm:text-sm';

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-medium hover:border-zinc-700 focus:outline-none transition-all shadow-sm ${sizeClasses}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? (
            selectedOption.badgeBg ? (
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${selectedOption.badgeBg}`}>
                {selectedOption.label}
              </span>
            ) : (
              selectedOption.label
            )
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 max-h-56 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 backdrop-blur-md animate-in fade-in">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                  isSelected ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {opt.icon}
                  {opt.label}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
