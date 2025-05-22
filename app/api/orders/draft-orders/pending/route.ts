// app/api/orders/draft-orders/pending/route.ts
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

const DRAFT_ORDERS_QUERY = `
  query getDraftOrders($query: String!) {
    draftOrders(first: 20, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          note
          tags
          customer {
            displayName
          }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
              }
            }
          }
        }
      }
    }
  }
`;

export async function GET(req: NextRequest) {
  try {
    const variables = {
      query: 'tag:"awaiting_approval"',
    };

    const data = await shopifyFetch(DRAFT_ORDERS_QUERY, variables);
    const orders = data?.draftOrders?.edges?.map((edge: any) => edge.node) || [];

    return NextResponse.json({
      draftOrders: orders,
    });
  } catch (error) {
    console.error('❌ Error fetching draft orders:', error);
    return NextResponse.json({ error: 'Failed to fetch draft orders', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
