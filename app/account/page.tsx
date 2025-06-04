'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Location {
  id: string;
  name: string;
}

interface Order {
  id: string;
  name: string;
  createdAt: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  displayFinancialStatus?: string;
}


export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Pagination and orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 50;

  const companyName = customer?.companyContactProfiles?.[0]?.company?.name || null;

  // Fetch customer info on mount
  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch('/api/customer');
        if (res.status === 200) {
          const data = await res.json();
          setCustomer(data);

          const locs: Location[] =
            data?.companyContactProfiles?.[0]?.company?.locations?.edges?.map((edge: any) => ({
              id: edge?.node?.id,
              name: edge?.node?.name,
            })) || [];

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

    fetchCustomer();
  }, [router]);

  // Fetch paginated orders whenever customer or currentPage changes
  useEffect(() => {
    async function fetchOrders(page: number) {
      setOrdersLoading(true);
      try {
        const res = await fetch(`/api/orders?page=${page}&limit=${ordersPerPage}`);
        const data = await res.json();

        setOrders(data.orders || []);
        setTotalOrders(data.total || 0);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrders([]);
        setTotalOrders(0);
      } finally {
        setOrdersLoading(false);
      }
    }

    if (customer?.email) {
      fetchOrders(currentPage);
    }
  }, [customer, currentPage]);

  // Location change handler
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
  };

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  if (loading) return <main className="p-8">Loading...</main>;

  return (
    <main className="p-6 sm:p-10 max-w-6xl mx-auto space-y-10">
      {customer && (
        <>
          {/* Welcome Header */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome, {customer.displayName}
          </h1>

          {/* User info + Location */}
          <section className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">User Information</h2>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">Company:</span> {companyName}</p>
                  <p><span className="font-medium">Email:</span> {customer.email}</p>
                  <p><span className="font-medium">Orders:</span> {customer.numberOfOrders}</p>
                </div>
              </div>

              {locations.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Company Location</h2>
                  <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-700">
                    Select a company location:
                  </label>
                  <select
                    id="location"
                    value={selectedLocationId}
                    onChange={handleLocationChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Orders Table */}
          <section className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order History</h2>

            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="min-w-full text-left">
                <thead className="bg-gray-100 border-b">
                    <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Order ID</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Financial Status</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                {ordersLoading ? (
                    <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                        Loading orders...
                    </td>
                    </tr>
                ) : orders.length === 0 ? (
                    <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                        No orders found.
                    </td>
                    </tr>
                ) : (
                    orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-800">{order.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{order.displayFinancialStatus || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                            {order.totalPrice?.amount} {order.totalPrice?.currencyCode}
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 px-2 text-sm text-gray-700">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
