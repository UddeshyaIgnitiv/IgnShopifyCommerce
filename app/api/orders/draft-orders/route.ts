// app/api/orders/draft-orders/route.ts
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

const DRAFT_ORDER_CREATE_MUTATION = `
  mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        note
        tags
        lineItems(first: 10) {
          edges {
            node {
              title
              quantity
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function POST(req: NextRequest) {
  try {
    const { customerId, lineItems } = await req.json();

    if (!customerId || !lineItems) {
      return NextResponse.json({ error: 'Missing customerId or lineItems' }, { status: 400 });
    }

    const variables = {
      input: {
        customerId: `gid://shopify/Customer/${customerId}`,
        lineItems,
        note: 'Submitted for approval via B2B UI',
        tags: ['awaiting_approval'],
      },
    };

    const data = await shopifyFetch(DRAFT_ORDER_CREATE_MUTATION, variables);
    const errors = data?.draftOrderCreate?.userErrors;

    if (errors?.length) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json({
      message: '✅ Draft order created successfully.',
      draftOrder: data.draftOrderCreate.draftOrder,
    });
  } catch (error) {
    console.error('❌ Draft order creation failed:', error);
    return NextResponse.json({ error: 'Server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
