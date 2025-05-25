//app\api\orders\draft-orders\pending\route.ts

import GET_PENDING_DRAFT_ORDERS from 'lib/shopify/queries/getPendingDraftOrders';
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const variables = {
      query: 'status:open tag:"awaiting_approval"',
    };

    // Fetch draft orders from Shopify
    const data = await shopifyFetch(GET_PENDING_DRAFT_ORDERS, variables);

    //console.log("📝 Raw draft order data:", JSON.stringify(data, null, 2));

    // Process the draft orders
    const orders =
      data?.draftOrders?.edges?.map((edge: any) => {
        const order = {
          id: edge.node.id,
          name: edge.node.name,
          createdAt: edge.node.createdAt,
          status: edge.node.status,
          tags: edge.node.tags,
          customer: edge.node.customer
            ? {
                id: edge.node.customer.id,
                firstName: edge.node.customer.firstName,
                lastName: edge.node.customer.lastName,
                email: edge.node.customer.email,
              }
            : null,
          lineItems: edge.node.lineItems.edges.map((itemEdge: any) => {
            //console.log("🔍 Raw line item node:", itemEdge.node.variant); 
            const lineItem = {
              title: itemEdge.node.title,
              quantity: itemEdge.node.quantity,
              imageUrl: itemEdge.node.variant?.image?.originalSrc || null,
            };

            // Log each line item
            //console.log("📦 Line item:", lineItem);
            return lineItem;
          }),
        };

        // Optional: Log entire order summary if needed
        // console.log("🧾 Draft Order:", {
        //   id: order.id,
        //   name: order.name,
        //   status:order.status,
        //   customer: order.customer,
        //   lineItemsCount: order.lineItems.length,
        // });

        return order;
      }) || [];

    console.log("✅ Processed Draft Orders:", orders.length);

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
