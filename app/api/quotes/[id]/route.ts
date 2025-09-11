// app/api/quotes/[id]/route.ts

import GET_DRAFT_ORDER from 'lib/shopify/queries/getDraftOrder';
import { shopifyFetch } from 'lib/shopify_service';
import { adminGraphql } from 'lib/shopifyAdmin';
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
      metafield: JSON.parse(draftOrder.metafield?.value || "[]")[0],
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

export async function POST(req: Request) {
  try {
    const { draftOrderId, namespace, key, value, type } = await req.json();

    if (!draftOrderId || !namespace || !key || !value) {
      return NextResponse.json(
        { error: 'Missing required fields for Quote metafield update!' },
        { status: 400 }
      );
    }

    const UPDATE_DRAFT_ORDER_METAFIELD = `
      mutation UpdateDraftOrderMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafieldsSetInput) {
          metafields {
            id
            namespace
            key
            value
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const res = await adminGraphql(UPDATE_DRAFT_ORDER_METAFIELD, {
      metafieldsSetInput: [
        {
          ownerId: draftOrderId,
          namespace,
          key,
          type: type || "list.single_line_text_field", // fallback
          value: JSON.stringify([value]),
        },
      ],
    });

    if (res?.metafieldsSet?.userErrors?.length) {
      return NextResponse.json(
        { error: res.metafieldsSet.userErrors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      metafields: res.metafieldsSet.metafields,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

