import React, { useState } from 'react';
import { Product, Flavor, CATEGORY_LABELS, FLAVOR_STATUS_LABELS, DEFAULT_VAPE_IMAGE, getVariantLabel } from '../types';
import { ShoppingBag, CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOrder: (product: Product, selectedFlavor: Flavor) => void;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOrder,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const flavors = product.flavors && product.flavors.length > 0
    ? product.flavors
    : [{ id: 'default', name: 'Основной вариант', status: 'in_stock' as const }];

  // Default select first available flavor, or first flavor
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(() => {
    const available = flavors.find(f => f.status === 'in_stock');
    return available ? available.id : flavors[0].id;
  });

  const selectedFlavor = flavors.find(f => f.id === selectedFlavorId) || flavors[0];
  const flavorStatusConfig = FLAVOR_STATUS_LABELS[selectedFlavor.status] || FLAVOR_STATUS_LABELS.in_stock;

  // Image fallback using vector vape bottle
  const displayImage = product.imageUrl && product.imageUrl.trim().length > 0
    ? product.imageUrl
    : DEFAULT_VAPE_IMAGE;

  const [showDesc, setShowDesc] = useState(false);
  const variantSingular = getVariantLabel(product.category, 'singular');

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-black/60">
      
      {/* Top Image Section */}
      <div>
        <div className="relative aspect-square w-full bg-[#0d0d12] overflow-hidden flex items-center justify-center">
          <img
            src={displayImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_VAPE_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40 pointer-events-none" />

          {/* Category Badge */}
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[10px] sm:text-xs font-medium text-zinc-300">
              {CATEGORY_LABELS[product.category] || product.category}
            </span>
          </div>

          {/* Admin Quick Action Floating Buttons */}
          {isAdmin && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(product)}
                  className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-all shadow-md"
                  title="Редактировать"
                >
                  ✎
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md"
                  title="Удалить"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Selected Flavor Status Badge */}
          <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border backdrop-blur-md ${flavorStatusConfig.badgeBg}`}>
              {selectedFlavor.status === 'in_stock' && <CheckCircle2 className="w-3 h-3" />}
              {selectedFlavor.status === 'reserved' && <AlertCircle className="w-3 h-3" />}
              {selectedFlavor.status === 'out_of_stock' && <XCircle className="w-3 h-3" />}
              <span>{flavorStatusConfig.label}</span>
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="text-xs sm:text-base font-bold text-zinc-100 line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">
              {product.title}
            </h3>
            {product.description && (
              <button 
                onClick={() => setShowDesc(!showDesc)}
                className="text-zinc-400 hover:text-zinc-200 p-0.5 shrink-0"
                title="Информация"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Optional Description */}
          {showDesc && product.description && (
            <p className="text-[11px] sm:text-xs text-zinc-400 my-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Variant Selector (Flavor / Color / Type) */}
          <div className="mt-2">
            <label className="block text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider mb-1">
              ВЫБОР ВКУСА:
            </label>
            <select
              value={selectedFlavorId}
              onChange={(e) => setSelectedFlavorId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {flavors.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  {fl.name} ({FLAVOR_STATUS_LABELS[fl.status]?.label || 'В наличии'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Footer Price & Order Button */}
      <div className="p-3 sm:p-4 pt-0">
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 block -mb-0.5">Цена</span>
            <span className="text-sm sm:text-lg font-black text-amber-400 font-mono">
              {product.price.toFixed(2)} <span className="text-xs font-normal text-amber-300/80">BYN</span>
            </span>
          </div>

          <button
            onClick={() => onOrder(product, selectedFlavor)}
            disabled={selectedFlavor.status === 'out_of_stock'}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
              selectedFlavor.status === 'out_of_stock'
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : 'bg-amber-600 hover:bg-amber-500 text-zinc-950 active:scale-[0.98]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Заказать</span>
          </button>
        </div>
      </div>

    </div>
  );
};
