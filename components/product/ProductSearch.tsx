'use client';

import { ProductOption } from 'app/types/product';
import { useCart } from 'components/cart/cart-context';
import { debounce } from 'lib/utils/debounce';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

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


  const { addMultipleCartItems } = useCart();
  const router = useRouter();

  // Debounced fetch (runs 0.5s after user stops typing)
  const fetchProducts = useCallback(
    debounce(async (query: string) => {
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
    }, 500),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchProducts(value);
  };

  const handleSelect = (product: ProductOption) => {
    onSelectAction(product);
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.variantId === product.variantId);
      if (existing) {
        return prev.map((p) =>
          p.variantId === product.variantId ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleIncrease = (variantId: string) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.variantId === variantId ? { ...p, quantity: p.quantity + 1 } : p
      )
    );
  };

  const handleDecrease = (variantId: string) => {
    setSelectedProducts((prev) =>
      prev
        .map((p) =>
          p.variantId === variantId ? { ...p, quantity: p.quantity - 1 } : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  const handleRemove = (variantId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.variantId !== variantId));
  };

  const handleBulkAdd = async () => {
    try {
      const response = await fetch('/api/cart/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedProducts }),
      });

      const data = await response.json();
      console.log('Quick add response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add products');
      }

      // Update cart context optimistically
      addMultipleCartItems(
        selectedProducts.map((p) => ({
          variantId: p.variantId,
          quantity: p.quantity,
        }))
      );

      alert('Products added to cart!');

      // Auto-close modal & refresh
      window.dispatchEvent(new CustomEvent('quick-order-close'));
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="w-[80vw] h-[80vh] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col p-6">
      <h2 className="text-xl font-semibold mb-4">Search and Select Product</h2>

      {/* Search box */}
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Search for a product..."
        className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && <p className="mt-2 text-sm text-gray-500">Loading...</p>}

      {/* Search results */}
      {/* <ul className="border mt-2 rounded-md max-h-48 overflow-y-auto shadow-sm bg-white">
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
      </ul> */}

      <ul className="border mt-2 rounded-md max-h-48 overflow-y-auto shadow-sm bg-white">
        {products.map((product) => (
          <li
            key={product.variantId}
            onClick={() => {
              if (!product.availableForSale) {
                alert(`${product.title} is not in stock and cannot be added.`);
                return;
              }
              handleSelect(product);
            }}
            className={`p-3 border-b last:border-b-0 flex items-center gap-3 ${product.availableForSale
              ? "cursor-pointer"
              : "cursor-not-allowed bg-gray-100 text-gray-400"
              }`}
          >
            {product.imageSrc && (
              <img
                src={product.imageSrc}
                alt={product.imageAlt || product.title}
                className={`w-10 h-10 object-cover rounded ${!product.availableForSale ? "opacity-50" : ""
                  }`}
              />
            )}
            <span>{product.title}</span>
          </li>
        ))}
        {!loading && products.length === 0 && searchTerm.length > 0 && (
          <li className="p-3 text-gray-500 italic">No products found</li>
        )}
      </ul>


      {/* Selected products table */}
      {selectedProducts.length > 0 && (
        <>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleBulkAdd}
              className="px-6 py-2 rounded-md font-medium"
            >
              Add All to Cart
            </button>
          </div>

          <div className="mt-6 flex-1 overflow-auto">
            <h3 className="text-lg font-medium mb-3">Selected Products</h3>
            <table className="w-full table-auto border border-gray-300 rounded-md overflow-hidden">
              <thead className="bg-gray-100">
                <tr className="h-14">
                  <th className="px-4 text-left align-middle">Product</th>
                  <th className="px-4 text-left align-middle">Variant ID</th>
                  <th className="px-4 text-left align-middle">Quantity</th>
                  <th className="px-4 text-left align-middle">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((item) => (
                  <tr key={item.variantId} className="border-t h-16">
                    <td className="px-4 align-middle">
                      <div className="flex items-center gap-3">
                        {item.imageSrc && (
                          <img
                            src={item.imageSrc}
                            alt={item.imageAlt || item.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 align-middle">
                      {extractShopifyId(item.variantId)}
                    </td>
                    <td className="px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrease(item.variantId)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center rounded-full  font-bold"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setSelectedProducts((prev) =>
                              prev.map((p) =>
                                p.variantId === item.variantId ? { ...p, quantity: val } : p
                              )
                            );
                          }}
                          className="w-14 h-8 text-center border border-gray-300 rounded-md focus:ring focus:ring-cyan"
                        />
                        <button
                          onClick={() => handleIncrease(item.variantId)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center rounded-full  font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 align-middle">
                      <button
                        onClick={() => handleRemove(item.variantId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
