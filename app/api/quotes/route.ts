import GET_DRAFT_ORDERS from 'lib/shopify/queries/getDraftOrders';
import { shopifyFetch } from 'lib/shopify_service';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();

    const emailRaw = cookieStore.get('user_email')?.value;
    const isAdminRaw = cookieStore.get('is_customer_admin')?.value;
    const rawCustomerId = cookieStore.get('customer_id')?.value;

    //const email = emailRaw ? decodeURIComponent(emailRaw) : null;
    const isAdmin = isAdminRaw === 'true';

    if (!rawCustomerId && !emailRaw) {
      return NextResponse.json({ error: 'Unauthorized: Missing customer ID or email' }, { status: 401 });
    }

    // Filter only by email or customerId if not admin
    let queryString = '';

    if (isAdmin) {
      if (rawCustomerId) {
        const customerId = decodeURIComponent(rawCustomerId);
        queryString = `customer_id:${customerId}`;
      } else if (emailRaw) {
        const email = decodeURIComponent(emailRaw);
        queryString = `customer_email:${email}`;
      }
    }

    //console.log('📦 Querying draft orders with:', queryString);

    const response = await shopifyFetch(GET_DRAFT_ORDERS, {
      query: queryString,
    });

    const draftOrders = response?.draftOrders?.edges?.map((edge: any) => edge.node) || [];

    return NextResponse.json({ draftOrders });
  } catch (error) {
    console.error('❌ Error fetching draft orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
