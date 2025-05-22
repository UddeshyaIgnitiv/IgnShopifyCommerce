'use client';

import { useEffect, useState } from 'react';

interface CustomerData {
  customerId: string;
  email: string;
  role: string;
}

export default function RoleBasedUI() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCustomerRole = async () => {
      try {
        const res = await fetch('/api/customers/role', {
          method: 'GET',
          credentials: 'include', // Ensures cookie (shopify_access_token) is sent
        });

        if (!res.ok) {
          const errData = await res.json();
          setError(errData.error || 'Failed to fetch role');
          return;
        }

        const data: CustomerData = await res.json();
        setCustomer(data);
      } catch (err) {
        console.error('[RoleBasedUI] Error:', err);
        setError('Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    getCustomerRole();
  }, []);

  const handleSubmitApproval = async () => {
    console.log('Submit for Approval logic here (e.g., create draft order)');
    // Example: await fetch('/api/create-draft-order', { method: 'POST' });
  };

  const handleApproveOrder = async () => {
    console.log('Approve & Place Order logic here (e.g., complete draft order)');
    // Example: await fetch('/api/complete-draft-order', { method: 'POST' });
  };

  if (loading) return <p>Loading role...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!customer?.role) return <p>No role assigned.</p>;

  return (
    <div>
      <p>
        Welcome <strong>{customer.email}</strong>. Your role is <strong>{customer.role}</strong>.
      </p>

      {customer.role === 'buyer' && (
        <button onClick={handleSubmitApproval} className="btn btn-primary">
          Submit for Approval
        </button>
      )}

      {customer.role === 'approver' && (
        <button onClick={handleApproveOrder} className="btn btn-success">
          Approve & Place Order
        </button>
      )}
    </div>
  );
}
