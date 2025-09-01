'use client';

import { useEffect, useState } from 'react';

interface QuoteDetailsModalProps {
  quoteId: string;
  onCloseAction: () => void;
}

interface Customer {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface ShippingAddress {
  company: string;
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  provinceCode?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

interface VariantImage {
  url?: string;
  altText?: string;
}

interface Variant {
  image?: VariantImage;
}

interface LineItem {
  title: string;
  quantity: number;
  variant?: Variant;
  price?: number; // Optional if available
}

interface PurchasingCompany {
  companyId?: string;
  companyLocationId?: string;
  companyContactId?: string;
  // Add more fields if available, e.g. companyName, locationName, etc.
}

interface PurchasingEntity {
  purchasingCompany?: PurchasingCompany;
}

interface Quote {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
  customer?: Customer;
  shippingAddress?: ShippingAddress;
  purchasingEntity?: PurchasingEntity;
  lineItems?: LineItem[];
  subtotalPrice?: number;
  totalPrice?: number;
  discountAmount?: number;
  shippingPrice?: number;
  taxAmount?: number | string;
}

export default function QuoteDetailsModal({ quoteId, onCloseAction }: QuoteDetailsModalProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const encodedGid = encodeURIComponent(quoteId);

  console.log("quote", quote);
  console.log('Line items:', quote?.lineItems);

  useEffect(() => {
    async function fetchQuoteDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quotes/${encodedGid}`);
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        const data = await res.json();
        setQuote(data.quote);
      } catch (err: any) {
        console.error('Error fetching quote:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchQuoteDetails();
  }, [encodedGid]);

  // Log the company field on each render to verify if it's available in UI
  console.log('Company in shipping address:', quote?.shippingAddress);

  function formatCurrency(amount?: number | string) {
    if (typeof amount === 'undefined' || amount === null) return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-details-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-gray-800/50 flex items-center justify-center p-4 md:p-6"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-fadeIn">
        {/* Header */}
        <header className="flex justify-between items-center px-10 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2
            id="quote-details-title"
            className="text-2xl font-bold tracking-wide text-gray-700 select-none"
          >
            Quote Details
          </h2>
          <button
            onClick={onCloseAction}
            aria-label="Close modal"
            className="text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-2 transition-colors duration-150"
            >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        </header>

        <main className="px-10 py-8 space-y-12 text-gray-800 flex-grow">
          {loading && (
            <p className="text-center text-xl font-medium py-24">Loading quote details…</p>
          )}

          {error && (
            <p className="text-center text-red-600 font-semibold py-24 text-lg">
              Error loading quote: {error}
            </p>
          )}

          {!loading && !error && quote && (
            <>
              {/* Basic Info */}
              <section className="overflow-x-auto bg-white rounded-lg shadow-md max-w-full">
                    <table className="min-w-full border border-gray-300 divide-y divide-gray-300">
                        <thead className="bg-indigo-100 border-b border-gray-300">
                        <tr>
                            <th
                            scope="col"
                            className="border-r border-gray-300 px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide"
                            >
                            Quote ID
                            </th>
                            <th
                            scope="col"
                            className="border-r border-gray-300 px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide"
                            >
                            Status
                            </th>
                            <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide"
                            >
                            Created At
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr className="hover:bg-indigo-50 transition-colors duration-150">
                            <td className="border-r border-gray-300 px-6 py-4 whitespace-nowrap font-medium text-gray-900 select-text">
                            {quote.name}
                            </td>
                            <td className="border-r border-gray-300 px-6 py-4 whitespace-nowrap capitalize text-gray-700 select-text">
                            {quote.status || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700 select-text">
                            {new Date(quote.createdAt).toLocaleString()}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </section>
              {/* Customer & Shipping */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Customer */}
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">
                    Customer Info
                  </h3>
                  {quote.customer ? (
                    <div className="space-y-2 text-md">
                      <p>
                        <strong>Name:</strong>{' '}
                        {[quote.customer.firstName, quote.customer.lastName]
                          .filter(Boolean)
                          .join(' ') || '-'}
                      </p>
                      <p>
                        <strong>Email:</strong> {quote.customer.email || '-'}
                      </p>
                    </div>
                  ) : (
                    <p className="italic text-gray-500">No customer information available.</p>
                  )}
                </div>

                {/* Shipping */}
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">
                    Shipping Address
                  </h3>
                  {quote.shippingAddress ? (
                     <address className="italic space-y-1 text-md leading-relaxed">
                      {quote.shippingAddress.company && (
      <p className="font-semibold">{quote.shippingAddress.company}</p>
    )}
    {quote.shippingAddress.name && <p>{quote.shippingAddress.name}</p>}
    {quote.shippingAddress.address1 && <p>{quote.shippingAddress.address1}</p>}
    {quote.shippingAddress.address2 && <p>{quote.shippingAddress.address2}</p>}
    {(quote.shippingAddress.city || quote.shippingAddress.provinceCode || quote.shippingAddress.zip) && (
      <p>
        {[quote.shippingAddress.city, quote.shippingAddress.provinceCode, quote.shippingAddress.zip]
          .filter(Boolean)
          .join(' ')}
      </p>
    )}
    {quote.shippingAddress.country && <p>{quote.shippingAddress.country}</p>}
    {quote.shippingAddress.phone && <p>{quote.shippingAddress.phone}</p>}

    <a
      href={`https://maps.google.com/?q=${encodeURIComponent(
        [
          quote.shippingAddress.address1,
          quote.shippingAddress.address2,
          quote.shippingAddress.city,
          quote.shippingAddress.provinceCode,
          quote.shippingAddress.zip,
          quote.shippingAddress.country,
        ]
          .filter(Boolean)
          .join(', ')
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline text-sm mt-2 block"
    >
      View map
    </a>
                    </address>
                  ) : (
                    <p className="italic text-gray-500">No shipping address provided.</p>
                  )}
                </div>
              </section>

              {/* Products */}
             <section>
                <h3 className="text-xl font-bold tracking-tight mb-4 border-b border-gray-300 pb-2">
                    Products
                </h3>

                {quote.lineItems && quote.lineItems.length > 0 ? (
                    <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-20">Image</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Title</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Qty</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Unit Price</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-700">
                        {quote.lineItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="border border-gray-300 px-3 py-2">
                                {item.variant?.image?.url ? (
                                <img
                                    src={item.variant.image.url}
                                    alt={item.variant.image.altText || item.title}
                                    className="w-12 h-12 object-cover rounded-sm"
                                />
                                ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400 text-xs">
                                    No Image
                                </div>
                                )}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-medium">{item.title}</td>
                            <td className="border border-gray-300 px-3 py-2 text-indigo-600 font-semibold">
                                {item.quantity}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-medium text-gray-800">
                                {formatCurrency(item.price)}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                ) : (
                    <p className="italic text-gray-500 text-sm mt-2">No products found.</p>
                )}
                </section>

              {/* Payment Summary */}
              <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-gray-700 mb-6 border-b border-indigo-300 pb-3">
                  Payment Summary
                </h3>
                <div className="space-y-3 text-lg text-gray-900">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(quote.subtotalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>{formatCurrency(quote.discountAmount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatCurrency(quote.shippingPrice ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span>{formatCurrency(quote.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xl border-t border-indigo-300 pt-4">
                    <span>Total</span>
                    <span>{formatCurrency(quote.totalPrice)}</span>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Tailwind animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }
        .select-text {
          user-select: text;
        }
      `}</style>
    </div>
  );
}
