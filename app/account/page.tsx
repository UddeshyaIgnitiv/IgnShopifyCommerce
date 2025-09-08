'use client';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LogoutButton from 'components/account/LogoutButton';
import InvoiceModal from 'components/InvoiceModal';
import QuoteDetailsModal from 'components/QuoteDetailsModal';
import UserAccountsManager from 'components/UserAccountsManager';
import Cookies from 'js-cookie';
import { useUserRole } from 'lib/utils/useUserRole';
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
  displayFulfillmentStatus?: string;
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Customer {
  id: string;
  email: string;
  displayName: string;
  numberOfOrders: number;
  companyContactProfiles?: {
    company: {
      id: string;
      name: string;
      locations: {
        edges: { node: Location }[];
      };
    };
  }[];
  metafields?: {
    namespace: string;
    key: string;
    value: string;
  }[];
}

interface Quote {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  lineItems?: {
    edges: {
      node: {
        id: string;
        title: string;
        quantity: number;
        variant?: {
          id: string;
        };
      };
    }[];
  };
}

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draftQuotes, setDraftQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination and orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const ordersPerPage = 50;
  const { role: userRole, loading: roleLoading } = useUserRole();

  const companyName = customer?.companyContactProfiles?.[0]?.company?.name || null;
  //console.log('Company data:', customer?.companyContactProfiles?.[0]?.company);
  //console.log('Company Id:', customer?.companyContactProfiles?.[0]?.company.id);
  //console.log("This is orders --> ", orders);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const customerId = customer?.id;

  if (!customerId) {
    console.warn('Customer ID is undefined. Skipping setting cookie.');
  } else {
    // customerId is now guaranteed to be a string here
    const numericId = customerId.split('/').pop();
    if (numericId) {
      Cookies.set('customer_id', encodeURIComponent(numericId), {
        secure: true,
        sameSite: 'Lax',
        path: '/',
        expires: 7,
      });
    } else {
      console.warn('Could not extract numeric ID from customerId:', customerId);
    }
}

  const tabs = [
    { id: 'profile', label: 'My Profile' },
    { id: 'orders', label: 'Orders & Invoices' },
    { id: 'manage-users', label: 'Manage Users' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'logout', label: 'Logout' },
  ];

  const isAdmin = !!(customer?.metafields ?? []).some(
    (m: any) =>
      m.namespace === 'custom' &&
      m.key === 'is_customer_admin' &&
      String(m.value).trim().toLowerCase() === 'true'
  );

  // Fetch customer info on mount
  useEffect(() => {
    async function fetchCustomer() {
      console.log('fetchCustomer called');
      try {
        const res = await fetch('/api/customer');
        if (res.status === 200) {
          const data = await res.json();
          // console.log('fetchCustomer data', data);
          setCustomer(data);

          const locs: Location[] =
            data?.companyContactProfiles?.[0]?.company?.locations?.edges?.map((edge: any) => ({
              id: edge?.node?.id,
              name: edge?.node?.name,
            })) || [];

          setLocations(locs);

          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          const cookieLocId = Cookies.get('companyLocationId');

          const companyId = data?.companyContactProfiles?.[0]?.company?.id;
          //console.log("companyId", companyId);

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

  useEffect(() => {
    if (activeTab === 'quotes') {
      const fetchQuotes = async () => {
        setQuotesLoading(true);
        try {
          const res = await fetch('/api/quotes');
          const data = await res.json();
          setDraftQuotes(data.draftOrders || []);
        } catch (err) {
          console.error('Failed to fetch quotes:', err);
        } finally {
          setQuotesLoading(false);
        }
      };

      fetchQuotes();
    }
  }, [activeTab]);

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
    // Refresh the application to ensure that the new location is reflected throughout the site.
    router.refresh();
  };


  if (loading) return <main className="p-8">Loading...</main>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Vertical Navigation */}
      <aside className={`
          fixed lg:static z-50 inset-y-0 left-0 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          flex flex-col
          overflow-y-auto
        `}>
        <div className="h-full flex flex-col">
          {/* Mobile close button */}
          <div className="flex justify-between items-center lg:hidden px-4 py-3 border-b">
            <span className="py-4 text-xl font-semibold text-gray-800">Account</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white text-md"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-5" />
            </button>
          </div>
          {/* Account heading for lg and up */}
          <div className="hidden lg:block px-6 py-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray">Account</h2>
          </div>
          <nav className="divide-y divide-gray-200">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => {setActiveTab(tab.id); setSidebarOpen(false);}}
                
                className={`px-6 py-4 cursor-pointer hover:bg-gray-100 transition text-gray-700 ${
                  activeTab === tab.id ? 'font-semibold text-teal-600 bg-gray-100' : ''
                }`}
              >
                {tab.label}
              </div>
            ))}
          </nav>
        </div>  
      </aside>

      {/* Right Content Area */}

      <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Top Bar */}
          <div className="lg:hidden flex items-center justify-between bg-white p-4 shadow">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white focus:outline-none"
            >
              <span className="inline-flex items-center space-x-2">
                <Bars3Icon className="h-6 text-md" />
                <span>Menu</span>
              </span>
            </button>
            <span className="font-semibold text-gray-800">Account</span>
          </div>
          <main className="flex-1 overflow-y-auto p-6 min-w-0">
            {activeTab === 'profile' && (
              <>
                {customer && (
                <>
                <section className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-xl font-bold mb-6">My Profile</h2>
                      <div className="space-y-2 text-gray-700">
                        <p><span className="font-medium">Company:</span> {companyName}</p>
                        <p><span className="font-medium">Email:</span> {customer.email}</p>
                        {/* <p><span className="font-medium">Orders:</span> {customer.numberOfOrders}</p> */}
                      </div>
                    </div>

                    {locations.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ship To Location</h2>
                        <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-700">
                          Select a ship to location:
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
                </>
                )}
              </>
            )}

            {activeTab === 'orders' && (
              <>
                {customer && (
                <section className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-bold mb-6">Orders & Invoices</h2>

                  <div className="overflow-x-auto rounded border border-gray-200">
                    <table className="min-w-full text-left">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Order ID</th>
                          <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Date</th>
                          <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Customer Info</th>
                          <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Financial Status</th>
                          <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Order Status</th>
                          <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Total</th>
                          <th className="border px-4 py-3 text-sm font-semibold text-gray-700"> Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ordersLoading ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                              Loading orders...
                            </td>
                          </tr>
                        ) : currentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                              No orders found.
                            </td>
                          </tr>
                        ) : (
                          currentOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="hover:bg-gray-50 transition cursor-pointer"
                              onClick={() => {
                                const numericOrderId = order.id.replace("gid://shopify/Order/", "");
                                window.location.href = `https://shopify.com/${process.env.NEXT_PUBLIC_SHOPIFY_SHOPID}/account/orders/${numericOrderId}`;
                              }}
                            >
                              <td className="px-4 py-3 text-sm text-gray-800">{order.name}</td>
                              <td className="border px-4 py-3 text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="border px-4 py-3 text-sm text-gray-600">
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                      {order.customer?.firstName || ''} {order.customer?.lastName || ''}
                                    </span>
                                    <span className="text-gray-600">{order.customer?.email || '-'}</span>
                                  </div>
                              </td>
                              <td className="border px-4 py-3 text-sm text-gray-800">
                                {order.displayFinancialStatus || '-'}
                              </td>
                              <td className="border px-4 py-3 text-sm text-gray-800">
                                {order.displayFulfillmentStatus || '-'}
                              </td>
                              <td className="border px-4 py-3 text-sm text-gray-800">
                                {order.totalPrice?.amount} {order.totalPrice?.currencyCode}
                              </td>
                              <td className="border px-4 py-3 text-sm">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // stops bubbling to <tr>
                                    setSelectedOrderId(order.id);
                                  }}
                                  disabled={order.displayFulfillmentStatus !== "FULFILLED"}
                                  className={`px-3 py-1 rounded 
                                    ${order.displayFulfillmentStatus !== "FULFILLED" ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  View Invoice
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {selectedOrderId && (
                    <InvoiceModal
                      orderId={selectedOrderId}
                      onClose={() => setSelectedOrderId(null)}
                    />
                  )}

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
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200
                            ${currentPage === 1 ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'button text-white border-gray-300 hover:button-primary-hover'}`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200
                            ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'button text-white border-gray-300 hover:button-primary-hover'}`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </section>
                )}
              </>
            )}

            {activeTab === 'manage-users' && (
              <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-6">Manage Users</h2>
                {customer && !loading && !roleLoading && userRole === 'admin' && (
                  <UserAccountsManager isAdmin={isAdmin} />
                )}
                {!roleLoading && userRole !== 'admin' && (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded">
                    You must be an admin customer to manage users.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'quotes' && (
              <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-6">Quotes</h2>
                {customer && (
                  <>
                    {quotesLoading ? (
                      <p>Loading quotes...</p>
                    ) : draftQuotes.length === 0 ? (
                      <p>No quotes found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Quote ID</th>
                              <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                              <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Created At</th>
                              <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Customer</th>
                              <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Email</th>
                              <th className="border px-4 py-3 text-sm font-semibold text-gray-700">Line Items</th>
                            </tr>
                          </thead>
                          <tbody>
                            {draftQuotes.map((quote) => (
                              <tr key={quote.id} className="bg-white">
                                <td className="border px-4 py-3 text-sm text-blue-800 hover:underline hover:text-blue-800 focus:outline-none cursor-pointer" onClick={() => setSelectedQuoteId(quote.id)}>{quote.name}</td>
                                <td className="border px-4 py-3 text-sm text-gray-800">{quote.status}</td>
                                <td className="border px-4 py-3 text-sm text-gray-800">{new Date(quote.createdAt).toLocaleDateString()}</td>
                                <td className="border px-4 py-3 text-sm text-gray-800">
                                  {quote.customer?.firstName} {quote.customer?.lastName}
                                </td>
                                <td className="border px-4 py-3 text-sm text-gray-800">{quote.customer?.email}</td>
                                <td className="border px-4 py-3 text-sm text-gray-800">
                                  <ul className="list-disc ml-4">
                                    {quote.lineItems?.edges.map(({ node }) => (
                                      <li key={node.variant?.id}>
                                        {node.title} × {node.quantity}
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {selectedQuoteId && (
                  <QuoteDetailsModal
                    quoteId={selectedQuoteId}
                    onCloseAction={() => setSelectedQuoteId(null)}
                  />
                )}

              </div>
            )}

            {activeTab === 'logout' && (
              <>
                <h2 className="text-xl font-bold mb-6">Logout</h2>
                <button className='cursor-pointer'>
                    <LogoutButton />
                </button>
              </>
            )}
          </main>
      </div>
    </div>
  );
}
