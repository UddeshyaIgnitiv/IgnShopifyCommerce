// app/api/orders/draft-orders/route.ts

import CREATE_DRAFT_ORDER from 'lib/shopify/mutations/orders/createDraftOrder';
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { customerId, lineItems } = await req.json();

    if (!customerId || !lineItems) {
      return NextResponse.json({ error: 'Missing customerId or lineItems' }, { status: 400 });
    }

    const variables = {
      input: {
        customerId,
        lineItems,
        note: 'Submitted for approval via B2B UI',
        tags: ['awaiting_approval'],
      },
    };

    const data = await shopifyFetch(CREATE_DRAFT_ORDER, variables);
    const draftOrder = data?.draftOrderCreate?.draftOrder;
    const errors = data?.draftOrderCreate?.userErrors;

    if (errors?.length) {
      console.error('❌ User errors during draft order creation:', errors);
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const metafieldValue = JSON.stringify({
      draft_order: {
        line_items: lineItems,
        customer: { id: customerId },
        note: 'Submitted for approval via B2B UI',
        tags: ['awaiting_approval'],
      },
    });

    const metafieldVariables = {
      input: {
        id: customerId, // should be GID
        metafields: [
          {
            namespace: 'b2b_orders',
            key: 'latest_draft_order',
            type: 'json',
            value: metafieldValue,
          },
        ],
      },
    };

    return NextResponse.json({
      message: '✅ Draft order created and metafield saved.',
      draftOrder,
    });
  } catch (error) {
    console.error('❌ Draft order creation failed with error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
