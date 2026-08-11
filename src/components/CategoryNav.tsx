import React from 'react';
import { Category, CATEGORY_LABELS } from '../types';
import { Sparkles, Droplets, Wrench, Shield, Smartphone } from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
  productCounts?: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  productCounts = {},
}) => {
  const categories: Array<{ id: Category | 'all'; label: string; icon: React.ReactNode }> = [
    { 
      id: 'all', 
      label: 'Все товары', 
      icon: <Sparkles className="w-4 h-4" /> 
    },
    { 
      id: 'liquids', 
      label: CATEGORY_LABELS.liquids, 
      icon: <Droplets className="w-4 h-4" /> 
    },
    { 
      id: 'consumables', 
      label: CATEGORY_LABELS.consumables, 
      icon: <Wrench className="w-4 h-4" /> 
    },
    { 
      id: 'snus', 
      label: CATEGORY_LABELS.snus, 
      icon: <Shield className="w-4 h-4" /> 
    },
    { 
      id: 'pods', 
      label: CATEGORY_LABELS.pods, 
      icon: <Smartphone className="w-4 h-4" /> 
    },
  ];

  return (
    <div className="w-full my-4 sm:my-6">
      {/* 
        Compact responsive grid without any horizontal scrollbar on mobile! 
        Uses 2 columns on mobile, 3 on small tablets, 5 on desktop.
      */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = productCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center justify-between sm:justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 border ${
                isSelected
                  ? 'bg-amber-600 text-zinc-950 font-bold border-amber-500 shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={isSelected ? 'text-zinc-950' : 'text-amber-500'}>
                  {cat.icon}
                </span>
                <span className="truncate">{cat.label}</span>
              </div>

              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected
                      ? 'bg-zinc-950/20 text-zinc-950 font-black'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
