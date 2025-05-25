'use client';

import { ProductOption } from 'app/types/product';
import { debounce } from 'lib/utils/debounce';
import { useState } from 'react';

const extractShopifyId = (gid: string) => gid.split('/').pop() || gid;

interface ProductSearchProps {
  onSelectAction: (product: ProductOption) => void;
}

interface SelectedProduct extends ProductOption {
  quantity: number;
}

export default function ProductSearch({ onSelectAction }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const fetchProducts = debounce(async (query: string) => {
    if (!query) {
      setProducts([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/product/products?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, 500);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchProducts(value);
  };

  const handleSelect = (product: ProductOption) => {
    onSelectAction(product);
    setSelectedProducts((prev) => {
      const existing = prev.find(p => p.variantId === product.variantId);
      if (existing) {
        return prev.map(p =>
          p.variantId === product.variantId
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleIncrease = (variantId: string) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.variantId === variantId ? { ...p, quantity: p.quantity + 1 } : p
      )
    );
  };

  const handleDecrease = (variantId: string) => {
    setSelectedProducts(prev =>
      prev
        .map(p =>
          p.variantId === variantId ? { ...p, quantity: p.quantity - 1 } : p
        )
        .filter(p => p.quantity > 0)
    );
  };

  const handleRemove = (variantId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.variantId !== variantId));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-md shadow">
      <h2 className="text-xl font-semibold mb-4">Search and Select Product</h2>

      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Search for a product..."
        className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && <p className="mt-2 text-sm text-gray-500">Loading...</p>}

      <ul className="border mt-2 rounded-md max-h-60 overflow-y-auto shadow-sm bg-white">
        {products.map((product) => (
          <li
            key={product.variantId}
            onClick={() => handleSelect(product)}
            className="cursor-pointer p-3 hover:bg-blue-100 border-b last:border-b-0 flex items-center gap-3"
          >
            {product.imageSrc && (
              <img
                src={product.imageSrc}
                alt={product.imageAlt || product.title}
                className="w-10 h-10 object-cover rounded"
              />
            )}
            <span>{product.title}</span>
          </li>
        ))}
        {!loading && products.length === 0 && searchTerm.length > 0 && (
          <li className="p-3 text-gray-500 italic">No products found</li>
        )}
      </ul>

      {selectedProducts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Selected Products</h3>
          <table className="w-full table-auto border border-gray-300 rounded-md overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Variant ID</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((item) => (
                <tr key={item.variantId} className="border-t">
                  <td className="p-3 flex items-center gap-3">
                    {item.imageSrc && (
                      <img
                        src={item.imageSrc}
                        alt={item.imageAlt || item.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <span>{item.title}</span>
                  </td>
                  <td className="p-3">{extractShopifyId(item.variantId)}</td>
                  <td className="p-3 flex items-center gap-2">
                    <button
                      onClick={() => handleDecrease(item.variantId)}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-400 text-gray-700 hover:bg-gray-200 transition text-base leading-none"
                    >
                      −
                    </button>
                    <span className="min-w-[20px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleIncrease(item.variantId)}
                      aria-label="Increase quantity"
                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-400 text-gray-700 hover:bg-gray-200 transition text-base leading-none"
                    >
                      +
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleRemove(item.variantId)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
