'use client';

import { ProductOption } from 'app/types/product';
import { useEffect, useState } from 'react';
import ProductSearch from './product/ProductSearch';

interface CustomerData {
  customerId: string;
  email: string;
  role: string;
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
  tags: string[];
  lineItems: {
    title: string;
    quantity: number;
  }[];
  customer?: {
    displayName: string;
  };
}

export default function RoleBasedUI() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [draftOrdersLoading, setDraftOrdersLoading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    async function getCustomerRole() {
      try {
        const res = await fetch('/api/customers/role', { method: 'GET', credentials: 'include' });
        if (!res.ok) {
          let errMsg = 'Failed to fetch role';
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch {}
          setError(errMsg);
          return;
        }
        const data: CustomerData = await res.json().catch(() => {
          setError('Invalid response from server');
          return null;
        });
        if (!data) return;

        setCustomer(data);

        if (data.role === 'approver') {
          setDraftOrdersLoading(true);
          try {
            const ordersRes = await fetch('/api/orders/draft-orders/pending');
            if (!ordersRes.ok) {
              setError('Failed to fetch pending draft orders');
              setDraftOrders([]);
            } else {
              const ordersData = await ordersRes.json().catch(() => {
                setError('Invalid draft orders response');
                return null;
              });
              if (ordersData?.draftOrders) {
                setDraftOrders(ordersData.draftOrders);
              } else {
                setDraftOrders([]);
              }
            }
          } catch {
            setError('Unexpected error fetching draft orders');
            setDraftOrders([]);
          } finally {
            setDraftOrdersLoading(false);
          }
        }
      } catch {
        setError('Unexpected error fetching role');
      } finally {
        setLoading(false);
      }
    }

    getCustomerRole();
  }, []);

  // Called when user selects a product variant from ProductSearch
  const handleProductSelect = (product: ProductOption) => {
    if (lineItems.find((item) => item.variantId === product.variantId)) {
      window.alert('Product variant already added');
      return;
    }
    setLineItems((prev) => [...prev, { title: product.title, quantity: 1, variantId: product.variantId }]);
  };

  const handleQuantityChange = (variantId: string, quantity: number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.variantId === variantId ? { ...item, quantity: Math.max(quantity, 1) } : item))
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setLineItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleSubmitApproval = async () => {
    if (!customer?.customerId || lineItems.length === 0) {
      window.alert('Customer ID or line items missing');
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
      window.alert(result.message || 'Draft order submitted successfully');
      setLineItems([]);
    } catch {
      window.alert('Failed to submit draft order');
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
      window.alert(result.message || 'Order approved');
    } catch {
      window.alert('Failed to complete order');
    }
  };

  if (loading) return <p className="text-gray-500">Loading role...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!customer?.role) return <p className="text-yellow-600">No role assigned.</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-6">
      <p className="text-lg font-medium mb-4">
        Welcome <strong>{customer.email}</strong>. Your role is <strong>{customer.role}</strong>.
      </p>

      {customer.role === 'buyer' && (
        <>
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">Add Products</h3>
            {/* Pass renamed prop onSelectAction to fix warning */}
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

      {customer.role === 'approver' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Pending Draft Orders</h2>

          {draftOrdersLoading ? (
            <p className="text-gray-500">Loading pending draft orders...</p>
          ) : draftOrders.length === 0 ? (
            <p>No pending draft orders found.</p>
          ) : (
            draftOrders.map((order) => (
              <div key={order.id} className="border p-4 mb-3 rounded">
                <p>
                  <strong>{order.name}</strong> – {order.note}
                </p>
                <p>Items:</p>
                <ul className="list-disc ml-5 mb-2">
                  {order.lineItems.map((item, index) => (
                    <li key={`${item.title}-${index}`}>
                      {item.title} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleApproveOrder(order.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Approve & Place Order
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
