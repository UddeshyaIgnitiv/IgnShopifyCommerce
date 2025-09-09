// app/api/quotes/[id]/route.ts

import GET_DRAFT_ORDER from 'lib/shopify/queries/getDraftOrder';
import { shopifyFetch } from 'lib/shopify_service';
import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const resolved = await params;
  const draftOrderId = decodeURIComponent(resolved.id);

  try {
    const data = await shopifyFetch(GET_DRAFT_ORDER, { id: draftOrderId });
    const draftOrder = data?.draftOrder;

    if (!draftOrder) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const lineItems = draftOrder.lineItems.edges.map(({ node }: any) => ({
      title: node.title,
      quantity: node.quantity,
      price: parseFloat(node.originalUnitPrice),  // convert string to number
      variant: node.variant,
      image: node.image,
    })) || [];

    const quote = {
      // data: draftOrder,
      companyName: draftOrder.purchasingEntity?.company?.name || '',
      locationName: draftOrder.purchasingEntity?.location?.name || '',
      invoiceUrl: draftOrder.invoiceUrl,
      id: draftOrder.id,
      name: draftOrder.name,
      status: draftOrder.status,
      createdAt: draftOrder.createdAt,
      customer: draftOrder.customer,
      shippingAddress: draftOrder.shippingAddress || null,
      lineItems,
      subtotalPrice: draftOrder.subtotalPrice || null,
      shippingPrice: draftOrder.totalShippingPriceSet?.shopMoney?.amount || 0,
      taxAmount: draftOrder.totalTaxSet?.shopMoney?.amount || 0,
      totalPrice: draftOrder.totalPrice || null,
      totalDiscounts: draftOrder.totalDiscountsSet?.shopMoney?.amount || 0,
    };

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json({ error: 'Failed to fetch quote details' }, { status: 500 });
  }
}
