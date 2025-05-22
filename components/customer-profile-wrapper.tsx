'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Lazy load the actual profile component
const CustomerProfile = dynamic(() => import('../app/customer/profile'), { ssr: false });

const CustomerProfileWrapper = () => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const cookies = document.cookie;
    const hasToken = cookies.includes('shopify_access_token=');

    if (hasToken) {
      setShouldRender(true);
    }
  }, []);

  if (!shouldRender) return null;

  return <CustomerProfile />;
};

export default CustomerProfileWrapper;
