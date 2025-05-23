'use client';

import { ProductOption } from 'app/types/product';
import { debounce } from 'lib/utils/debounce';
import { useState } from 'react';

// Utility to extract numeric Shopify ID
const extractShopifyId = (gid: string) => gid.split('/').pop() || gid;

interface ProductSearchProps {
  onSelectAction: (product: ProductOption) => void;
}

export default function ProductSearch({ onSelectAction }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);

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
    if (!selectedProducts.find(p => p.variantId === product.variantId)) {
      setSelectedProducts(prev => [...prev, product]);
    }
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
            className="cursor-pointer p-3 hover:bg-blue-100 border-b last:border-b-0"
          >
            {product.title}
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
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Variant ID</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((item) => (
                <tr key={item.variantId} className="border-t">
                  <td className="p-3">{item.title}</td>
                  <td className="p-3">{extractShopifyId(item.variantId)}</td>
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
