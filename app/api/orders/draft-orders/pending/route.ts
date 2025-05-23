import GET_PENDING_DRAFT_ORDERS from 'lib/shopify/queries/getPendingDraftOrders';
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const variables = {
      query: 'tag:"awaiting_approval"',
    };

    const data = await shopifyFetch(GET_PENDING_DRAFT_ORDERS, variables);

    console.log("data", data);
    const orders = data?.draftOrders?.edges?.map((edge: any) => edge.node) || [];

    console.log("orders", orders);

    return NextResponse.json({
      draftOrders: orders,
    });
  } catch (error) {
    console.error('❌ Error fetching draft orders:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch draft orders',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
