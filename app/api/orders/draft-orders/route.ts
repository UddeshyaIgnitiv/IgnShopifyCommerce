// app/api/orders/draft-orders/route.ts

import CREATE_DRAFT_ORDER from 'lib/shopify/mutations/orders/createDraftOrder';
import UPDATE_CUSTOMER_METAFIELD from 'lib/shopify/mutations/orders/updateCustomerDraftOrder';
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('▶️ Incoming request to create draft order...');

    const { customerId, lineItems } = await req.json();
    console.log('📥 Received input:', { customerId, lineItems });

    if (!customerId || !lineItems) {
      console.warn('⚠️ Missing customerId or lineItems in request');
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
    console.log('📦 Variables for CREATE_DRAFT_ORDER:', variables);

    const data = await shopifyFetch(CREATE_DRAFT_ORDER, variables);
    console.log('✅ Draft order creation response:', data);

    const draftOrder = data?.draftOrderCreate?.draftOrder;
    const errors = data?.draftOrderCreate?.userErrors;

    if (errors?.length) {
      console.error('❌ User errors during draft order creation:', errors);
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    console.log('🆔 Draft order created with ID:', draftOrder?.id);

    const metafieldValue = JSON.stringify({
      draft_order: {
        line_items: lineItems,
        customer: { id: customerId },
        note: 'Submitted for approval via B2B UI',
        tags: ['awaiting_approval'],
      },
    });

    console.log('📝 Prepared metafield JSON value:', metafieldValue);

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

    console.log('📤 Sending metafield update to Shopify:', metafieldVariables);

    const metafieldResult = await shopifyFetch(UPDATE_CUSTOMER_METAFIELD, metafieldVariables);
    console.log('✅ Metafield update response:', metafieldResult);

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
