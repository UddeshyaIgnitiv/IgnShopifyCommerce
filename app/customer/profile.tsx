'use client';

import { useEffect, useState } from 'react';

type Customer = {
  id: string;
  firstName: string;
  email: string;
  metafields: {
    key: string;
    value: string;
  }[];
};

const CustomerProfile = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch('/api/customer', {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch customer data');
        }

        setCustomer(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, []);

  if (loading) return <p>Loading customer profile...</p>;
  if (error) return <p>Error: {error}</p>;

  return customer ? (
  <div>
    <h2>Customer Profile</h2>
    <p><strong>ID:</strong> {customer.id}</p>
    <p><strong>First Name:</strong> {customer.firstName}</p>
    <p><strong>Email:</strong> {customer.email}</p>

    {customer.metafields?.length && customer.metafields[0]?.value ? (
      <p><strong>Role:</strong> {customer.metafields[0].value}</p>
    ) : (
      <p><strong>Role:</strong> Not assigned</p>
    )}
  </div>
) : (
  <p>No customer data found.</p>
);
};

export default CustomerProfile;
