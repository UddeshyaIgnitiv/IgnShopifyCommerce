'use client';

import { ProductOption } from 'app/types/product';
import { useEffect, useState } from 'react';
import ProductSearch from './product/ProductSearch';

interface CustomerData {
  customerId: string;
  email: string;
  role: 'purchaser' | 'admin' | string;
}

interface LineItem {
  title: string;
  quantity: number;
  variantId: string;
}

interface DraftOrder {
  id: string;
  name: string;
  note: string;
  tags: string[];  // tags as array of strings
  lineItems: {
    title: string;
    quantity: number;
    imageUrl?: string;
  }[];
  customer?: {
    displayName: string;
  };
}

export default function RoleBasedUI() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [draftOrdersLoading, setDraftOrdersLoading] = useState(false);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const fetchCustomerRole = async () => {
      try {
        const res = await fetch('/api/customers/role', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || 'Failed to fetch customer role');
        }

        const data: CustomerData = await res.json();
        setCustomer(data);

        if (data.role === 'admin') {
          await fetchDraftOrders();
        }
      } catch (err: any) {
        setError(err.message || 'Unexpected error fetching role');
      } finally {
        setLoading(false);
      }
    };

    const fetchDraftOrders = async () => {
      setDraftOrdersLoading(true);
      try {
        const res = await fetch('/api/orders/draft-orders/pending');
        if (!res.ok) throw new Error('Failed to fetch pending draft orders');

        const data = await res.json();
        
        setDraftOrders(data?.draftOrders || []);
      } catch (err) {
        console.error('❌ Error fetching draft orders:', err);
        setError('Error fetching pending draft orders');
        setDraftOrders([]);
      } finally {
        setDraftOrdersLoading(false);
      }
    };

    fetchCustomerRole();
  }, []);

  useEffect(() => {
    if (alertMessage) {
      const timeout = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [alertMessage]);

  const handleProductSelect = (product: ProductOption) => {
    if (lineItems.find((item) => item.variantId === product.variantId)) {
      setAlertMessage('Product variant already added');
      setAlertType('error');
      return;
    }
    setLineItems((prev) => [...prev, { title: product.title, quantity: 1, variantId: product.variantId }]);
  };

  const handleQuantityChange = (variantId: string, quantity: number) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity: Math.max(quantity, 1) } : item
      )
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setLineItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleSubmitApproval = async () => {
    if (!customer?.customerId || lineItems.length === 0) {
      setAlertMessage('Customer ID or line items missing');
      setAlertType('error');
      return;
    }

    try {
      const res = await fetch('/api/orders/draft-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.customerId,
          lineItems,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Failed to submit draft order');

      setAlertMessage(result.message || 'Draft order submitted successfully');
      setAlertType('success');
      setLineItems([]);
    } catch (err: any) {
      setAlertMessage(err.message || 'Failed to submit draft order');
      setAlertType('error');
    }
  };

  const handleApproveOrder = async (draftOrderId: string) => {
    try {
      const res = await fetch('/api/orders/draft-orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftOrderId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Failed to approve order');

      setAlertMessage(result.message || 'Order approved');
      setAlertType('success');
      setDraftOrders((prev) => prev.filter((order) => order.id !== draftOrderId));
    } catch (err: any) {
      setAlertMessage(err.message || 'Failed to approve order');
      setAlertType('error');
    }
  };

  if (loading) return <p className="text-gray-500">Loading role...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!customer?.role) return <p className="text-yellow-600">No role assigned.</p>;

  return (
    <>
      {alertMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div
            className={`flex items-start p-4 rounded-lg shadow-lg text-sm text-white ${
              alertType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <div className="flex-1">{alertMessage}</div>
            <button
              onClick={() => setAlertMessage(null)}
              className="ml-4 text-lg leading-none focus:outline-none hover:opacity-75"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <p className="text-lg font-medium mb-4">
        Welcome <strong>{customer.email}</strong>. Your role is <strong>{customer.role}</strong>.
      </p>

      {customer.role === 'purchaser' && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Create Draft Orders</h3>
            <ProductSearch onSelectAction={handleProductSelect} />
          </div>

          <button
            onClick={handleSubmitApproval}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🚀 Submit for Approval
          </button>
        </>
      )}

      {customer.role === 'admin' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Draft Orders</h2>

          {draftOrdersLoading ? (
            <p className="text-gray-500">Loading pending draft orders...</p>
          ) : draftOrders.length === 0 ? (
            <p className="text-gray-500">No pending draft orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Order ID
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Ordered Items
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {draftOrders
                    .filter(order => !order.tags.includes('approved'))  // Show only open (not approved) orders
                    .map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 align-top">
                        <td className="border border-gray-300 px-4 py-3 text-gray-800 font-semibold whitespace-nowrap align-top">
                          {order.name}
                          {order.customer?.displayName && (
                            <p className="text-xs text-gray-500 mt-1">Customer: {order.customer.displayName}</p>
                          )}
                        </td>

                        <td className="border border-gray-300 text-gray-700 text-sm max-w-xs align-top">
                          <ul className="space-y-2">
                            {order.lineItems.map((item, idx) => (
                              <li
                                key={`${item.title}-${idx}`}
                                className="grid grid-cols-3 px-2 py-1 border-b last:border-b-0 items-center"
                              >
                                {/* Image */}
                                <div>
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl || '/path/to/placeholder-image.jpg'}
                                      alt={item.title}
                                      className="w-10 h-10 rounded-md object-cover border border-gray-200"
                                      onError={(e) => {
                                        console.error(`❌ Failed to load image: ${item.imageUrl}`);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>

                                {/* Product Title */}
                                <div>{item.title}</div>

                                {/* Quantity */}
                                <div className="text-center font-semibold">{item.quantity}</div>
                              </li>
                            ))}
                          </ul>
                        </td>

                        <td className="border border-gray-300 px-4 py-3 text-center align-top">
                          <button
                            onClick={() => handleApproveOrder(order.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
                          >
                            Approve & Place Order
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
