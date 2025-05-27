'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Location {
  id: string;
  name: string;
}

export default function LocationDropdown() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/customer');
        if (res.status === 200) {
          const data = await res.json();
          setCustomer(data);

          const edges = data?.companyContactProfiles?.[0]?.company?.locations?.edges ?? [];

          const locs: Location[] = edges.map((edge: any) => ({
            id: edge.node.id,
            name: edge.node.name,
          }));

          setLocations(locs);

          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const cookieLocId = Cookies.get('companyLocationId');

          if (cookieLocId) {
            setSelectedLocationId(cookieLocId);
          } else {
            const firstLocId = locs[0]?.id;
            if (firstLocId) {
              setSelectedLocationId(firstLocId);
              Cookies.set('companyLocationId', firstLocId, {
                secure: isSecure,
                sameSite: 'Lax',
                path: '/',
                expires: 7,
              });
            } else {
              router.replace('/register-company');
            }
          }
        } else {
          router.replace('/register-company');
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        router.replace('/register-company');
      } finally {
        setLoading(false);
      }
    }

    const token = Cookies.get('shopify_access_token');
    if (!token) {
      router.replace('/register-company');
      return;
    }

    fetchLocations();
  }, [router]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedLocationId(newId);

    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    Cookies.set('companyLocationId', newId, {
      secure: isSecure,
      sameSite: 'Lax',
      path: '/',
      expires: 7,
    });

    router.refresh(); // Refresh the page to reflect the selected location
  };

    if (loading && locations.length > 0) {
        return <div className="p-4 text-gray-600">Loading locations...</div>;
    }

    if (!selectedLocationId || locations.length === 0) {
        return null; // Do not render dropdown at all
    }

  return (
    <div className="flex flex-col">
      <label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1">
        Select a company location:
      </label>
      <select
        id="location"
        value={selectedLocationId}
        onChange={handleLocationChange}
        className="p-2 border border-gray-300 rounded text-sm"
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
