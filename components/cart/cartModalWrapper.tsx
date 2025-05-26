'use client';

import { useEffect, useState } from 'react';
import CartModal from 'components/cart/modal';

function getCookies(): { token: string | null; locationId: string | null } {
    if (typeof document === 'undefined') return { token: null, locationId: null };

    const get = (name: string) => {
        const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
        const value = match?.[1];
        return typeof value === 'string' ? decodeURIComponent(value) : null;
    };

    return {
        token: get('shopify_access_token'),
        locationId: get('companyLocationId'),
    };
}


export default function CartModalWrapper() {
    const [cookies, setCookies] = useState(() => getCookies());
    console.log("CartWrapperCalled")

    useEffect(() => {
        const interval = setInterval(() => {
            const current = getCookies();
            if (
                current.token !== cookies.token ||
                current.locationId !== cookies.locationId
            ) {
                setCookies(current); // Trigger re-render
                console.log("Re render called")
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [cookies]);

    return (
        <CartModal key={JSON.stringify([cookies.token, cookies.locationId])} />
    );
}
