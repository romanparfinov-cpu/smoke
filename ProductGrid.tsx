import React from 'react';
import { Product, Flavor } from '../types';
import { ProductCard } from './ProductCard';
import { PackageOpen, PlusCircle } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onOrder: (product: Product, selectedFlavor: Flavor) => void;
  isAdmin?: boolean;
  loading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onAddProduct?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onOrder,
  isAdmin,
  loading = false,
  onEdit,
  onDelete,
  onAddProduct,
}) => {
  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 my-6">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse flex flex-col h-[340px]">
            <div className="w-full h-44 bg-zinc-800/80" />
            <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded-md w-3/4" />
                <div className="h-3 bg-zinc-800/60 rounded-md w-full" />
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-zinc-800 rounded-xl w-1/2" />
                <div className="h-9 bg-zinc-800 rounded-xl w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-zinc-900/60 border border-zinc-800 rounded-3xl my-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 mb-4 shadow-sm">
          <PackageOpen className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 animate-bounce" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-zinc-100 mb-2">
          Каталог пока пуст
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6">
          В данном разделе пока нет доступных товаров. Скоро администратор добавит новейшую вейп-продукцию!
        </p>
        
        {isAdmin && onAddProduct && (
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-sm transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Добавить первый товар</span>
          </button>
        )}
      </div>
    );
  }

  return (
    // Responsive Grid: Strictly 2 items per row on mobile screens (`grid-cols-2`)
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 my-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onOrder={onOrder}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
