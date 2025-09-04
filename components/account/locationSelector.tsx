'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Location = {
  id: string;
  name: string;
};

export default function LocationSelector() {
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [locations, setLocations] = useState<Location[]>([]);
    const cookieLocId = Cookies.get('companyLocationId');
    const router = useRouter();

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setSelectedLocationId(newId);
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

        Cookies.set('companyLocationId', newId, {
            secure: isSecure,
            sameSite: 'Lax',
            path: '/',
            expires: 7, // js-cookie expects days for `expires`
        });
    };

    useEffect(() => {
        async function fetchCustomer() {
            try {
                const res = await fetch('/api/customer');
                if (res.status === 200) {
                    const data = await res.json();
                    const locs: Location[] =
                    data?.companyContactProfiles?.[0]?.company?.locations?.edges?.map((edge: any) => ({
                        id: String(edge?.node?.id || ''),
                        name: String(edge?.node?.name || ''),
                    })) || [];

                    setLocations(locs);

                    if (cookieLocId) {
                        setSelectedLocationId(String(cookieLocId));
                    }
                }
            } catch (err) {
                console.error('Error fetching customer:', err);
            }
        }
        fetchCustomer();
    }, [router]); // Removed router dependency if not used

    if (locations.length === 0) {
        return null; // Don't render if there are no locations
    }

    return (
        <>
        <div className="flex items-center space-x-3 hover:bg-red-100 dark:hover:bg-red-700 p-2 rounded-md cursor-pointer transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2c-4.41 0-8 3.59-8 8 0 5.48 7.05 13.91 7.42 14.36.14.16.34.24.58.24s.44-.08.58-.24c.37-.45 7.42-8.88 7.42-14.36 0-4.41-3.59-8-8-8zm0 11.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
            </svg>
            <span className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">Ship To Location</span>
        </div>
        <div className="w-full">
            <select
                id="location"
                value={selectedLocationId}
                onChange={handleLocationChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                    {loc.name}
                </option>
                ))}
            </select>
        </div>
        </>
    );
}