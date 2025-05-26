'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface Location {
    id: string;
    name: string;
}

export default function AccountPage() {
    const router = useRouter();
    const [customer, setCustomer] = useState<any>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCustomer() {
            try {
                const res = await fetch('/api/customer');
                if (res.status === 200) {
                    const data = await res.json();

                    setCustomer(data);

                    const locs: Location[] = data?.companyContactProfiles?.[0]?.company?.locations?.edges?.map(
                        (edge: any) => ({
                            id: edge?.node?.id,
                            name: edge?.node?.name,
                        })
                    ) || [];

                    setLocations(locs);

                    const cookieLocId = Cookies.get('companyLocationId');
                    if (cookieLocId) {
                        setSelectedLocationId(cookieLocId);
                    } else {
                        const firstLocId = locs[0]?.id;
                        if (firstLocId) {
                            setSelectedLocationId(firstLocId);
                            Cookies.set('companyLocationId', firstLocId, {
                                secure: true,
                                sameSite: 'Lax',
                            });
                        } else {
                            // ❗ If no locations found at all
                            router.replace('/register');
                        }
                    }
                } else {
                    router.replace('/register');
                }
            } catch (err) {
                console.error('Error fetching customer:', err);
                router.replace('/register');
            } finally {
                setLoading(false);
            }
        }

        const token = Cookies.get('shopify_access_token');
        if (!token) {
            router.replace('/register');
            return;
        }

        fetchCustomer();
    }, [router]);

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        setSelectedLocationId(newId);
        Cookies.set('companyLocationId', newId, { secure: true, sameSite: 'Lax' });
    };

    if (loading) return <main className="p-8">Loading...</main>;

    return (
        <main className="p-8">
            <h1 className="text-xl font-semibold mb-4">Welcome to your account dashboard</h1>

            {customer && (
                <>
                    <p><strong>Name:</strong> {customer.displayName}</p>
                    <p><strong>Email:</strong> {customer.email}</p>
                    <p><strong>Orders:</strong> {customer.numberOfOrders}</p>

                    {locations.length > 0 && (
                        <div className="mt-6">
                            <label htmlFor="location" className="block mb-2 text-lg font-medium">
                                Select a company location:
                            </label>
                            <select
                                id="location"
                                value={selectedLocationId}
                                onChange={handleLocationChange}
                                className="p-2 border border-gray-300 rounded"
                            >
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
