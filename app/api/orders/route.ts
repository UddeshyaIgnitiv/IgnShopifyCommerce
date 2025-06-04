import { GET_CUSTOMER_ORDERS } from 'lib/shopify/queries/getCustomerOrders';
import { shopifyFetch } from 'lib/shopify_service';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const emailRaw = (await cookieStore).get('user_email')?.value;
    const email = emailRaw ? decodeURIComponent(emailRaw) : null;

    if (!email) {
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
    }

    const variables = {
      first: 20,
      query: `customer_email:${email}`,
    };

    const data = await shopifyFetch(GET_CUSTOMER_ORDERS, variables);
    const orders =
      data?.orders?.edges?.map(({ node }: any) => ({
        id: node.id,
        name: node.name,
        createdAt: node.createdAt,
        displayFinancialStatus: node.displayFinancialStatus,
        totalPrice: {
          amount: node.totalPriceSet?.shopMoney?.amount || '0.00',
          currencyCode: node.totalPriceSet?.shopMoney?.currencyCode || 'USD',
        },
        
      })) || [];

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('❌ Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer orders', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
