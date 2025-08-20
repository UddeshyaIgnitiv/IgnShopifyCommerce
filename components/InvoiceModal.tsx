'use client';

import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

interface Money {
    amount: string;
    currencyCode: string;
}

interface InvoiceModalProps {
    orderId: string | null;
    onClose: () => void;
}

export default function InvoiceModal({ orderId, onClose }: InvoiceModalProps) {
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: order ? `Invoice-${order.name}` : 'Invoice'
    });

    useEffect(() => {
        if (!orderId) return;
        setLoading(true);

        fetch(`/api/getOrder?id=${encodeURIComponent(orderId)}`)
            .then((res) => res.json())
            .then((data) => {
                const o = data.order;

                // Transform to UI-friendly shape
                const transformed = {
                    name: o.name,
                    createdAt: o.createdAt,
                    poNumber: o.poNumber,
                    billingAddress: {
                        name: `${o.billingAddress?.firstName || ''} ${o.billingAddress?.lastName || ''}`.trim(),
                        company: o.billingAddress?.company,
                        address1: o.billingAddress?.address1,
                        address2: o.billingAddress?.address2,
                        city: o.billingAddress?.city,
                        province: o.billingAddress?.province,
                        zip: o.billingAddress?.zip,
                        country: o.billingAddress?.country,
                    },
                    shippingAddress: {
                        name: `${o.shippingAddress?.firstName || ''} ${o.shippingAddress?.lastName || ''}`.trim(),
                        company: o.shippingAddress?.company,
                        address1: o.shippingAddress?.address1,
                        address2: o.shippingAddress?.address2,
                        city: o.shippingAddress?.city,
                        province: o.shippingAddress?.province,
                        zip: o.shippingAddress?.zip,
                        country: o.shippingAddress?.country,
                        phone: o.shippingAddress?.phone,
                    },
                    lineItems: o.lineItems.edges.map((edge: any) => ({
                        title: edge.node.title,
                        quantity: edge.node.quantity,
                        sku: edge.node.sku,
                        currentQuantity: edge.node.currentQuantity,
                        discountedTotal: edge.node.discountedTotalSet?.shopMoney,
                        originalTotal: edge.node.originalTotalSet?.shopMoney,
                    })),
                    totals: {
                        subtotal: o.subtotalPriceSet?.shopMoney,
                        tax: o.totalTaxSet?.shopMoney,
                        shipping: o.totalShippingPriceSet?.shopMoney,
                        total: o.totalPriceSet?.shopMoney,
                    },
                    transactions: o.transactions?.map((t: any) => ({
                        gateway: t.gateway,
                        amount: t.amountSet?.shopMoney,
                        kind: t.kind,
                        status: t.status,
                    })),
                    supportEmail: 'pankit.b@ignitiv.com',
                };

                setOrder(transformed);
            })
            .catch((err) => {
                console.error('Error fetching invoice:', err);
            })
            .finally(() => setLoading(false));
    }, [orderId]);

    if (!orderId) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 print:static print:bg-white">
            <div className="bg-white w-[950px] max-h-[90vh] overflow-y-auto rounded shadow-lg p-8 relative print:shadow-none print:w-full print:p-0">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 print:hidden"
                >
                    ✕
                </button>

                {loading ? (
                    <p>Loading invoice...</p>
                ) : !order ? (
                    <p>No order found.</p>
                ) : (
                    <div ref={printRef} id="invoice-content" className="text-sm text-gray-800 font-sans print:mx-8">
                        <h1 className="text-2xl font-bold mb-6">Invoice</h1>

                        {/* Bill to / Ship to */}
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div>
                                <h3 className="font-semibold">Bill to</h3>
                                <p>{order.billingAddress.name}</p>
                                <p>{order.billingAddress.company}</p>
                                <p>{order.billingAddress.address1}</p>
                                {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                                <p>
                                    {order.billingAddress.city} {order.billingAddress.province}{' '}
                                    {order.billingAddress.zip}
                                </p>
                                <p>{order.billingAddress.country}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Ship to</h3>
                                <p>{order.shippingAddress.name}</p>
                                <p>{order.shippingAddress.company}</p>
                                <p>{order.shippingAddress.address1}</p>
                                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                                <p>
                                    {order.shippingAddress.city} {order.shippingAddress.province}{' '}
                                    {order.shippingAddress.zip}
                                </p>
                                <p>{order.shippingAddress.country}</p>
                                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                            </div>
                            <div className="font-semibold">
                                <p>Order: {order.name}</p>
                                {order.poNumber && <p>PO # {order.poNumber}</p>}
                                <p>Order Created At: {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <table className="w-full border-t border-b border-gray-300 mb-8">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-2 text-left">Sku</th>
                                    <th className="py-2 px-2 text-left">Qty</th>
                                    <th className="py-2 px-2 text-left">Item</th>
                                    <th className="py-2 px-2 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.lineItems
                                    .filter((item: any) => item.currentQuantity !== 0)
                                    .map((item: any, idx: number) => (
                                        <tr key={idx} className="border-t border-gray-200">
                                            <td className="py-2 px-2">{item.sku}</td>
                                            <td className="py-2 px-2">{item.quantity}</td>
                                            <td className="py-2 px-2">{item.title}</td>
                                            <td className="py-2 px-2 text-right">
                                                {item.discountedTotal?.amount} {item.discountedTotal?.currencyCode}
                                            </td>
                                        </tr>
                                    ))}
                                <tr className="border-t border-gray-300">
                                    <td colSpan={3} className="py-2 px-2 text-right font-medium">Subtotal</td>
                                    <td className="py-2 px-2 text-right">
                                        {order.totals.subtotal?.amount} {order.totals.subtotal?.currencyCode}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="py-2 px-2 text-right font-medium">Tax</td>
                                    <td className="py-2 px-2 text-right">
                                        {order.totals.tax?.amount} {order.totals.tax?.currencyCode}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="py-2 px-2 text-right font-medium">Shipping</td>
                                    <td className="py-2 px-2 text-right">
                                        {order.totals.shipping?.amount} {order.totals.shipping?.currencyCode}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="py-2 px-2 text-right font-bold">Total</td>
                                    <td className="py-2 px-2 text-right font-bold">
                                        {order.totals.total?.amount} {order.totals.total?.currencyCode}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Transactions */}
                        {order.transactions?.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2">Transaction Details</h3>
                                <table className="w-full border border-gray-300">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border px-2 py-1">Type</th>
                                            <th className="border px-2 py-1">Amount</th>
                                            <th className="border px-2 py-1">Kind</th>
                                            <th className="border px-2 py-1">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.transactions.map((t: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="border px-2 py-1">{t.gateway}</td>
                                                <td className="border px-2 py-1">
                                                    {t.amount?.amount} {t.amount?.currencyCode}
                                                </td>
                                                <td className="border px-2 py-1">{t.kind}</td>
                                                <td className="border px-2 py-1">{t.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p className="mt-6 text-xs">
                            If you have any questions, please send an email to {order.supportEmail}
                        </p>

                        {!loading && order && (
                            <div className="mt-6 text-right print:hidden">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Print
                                </button>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
