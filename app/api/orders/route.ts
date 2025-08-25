import { GET_CUSTOMER_ORDERS } from 'lib/shopify/queries/getCustomerOrders';
import { shopifyFetch } from 'lib/shopify_service';
import { getCompanyContacts } from 'lib/shopifyAdmin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const emailRaw = cookieStore.get('user_email')?.value;
    const email = emailRaw ? decodeURIComponent(emailRaw) : null;
    //const isAdmin = cookieStore.get('is_customer_admin')?.value === 'true';
    const companyId = cookieStore.get('company_id')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
    }

    let query: string;
    let role: string | null = null;
    let contacts: any[] = [];

    if (companyId) {
      contacts = await getCompanyContacts(companyId);
      const me = contacts?.find((c: any) => c.email === email);
      role = me?.b2bRole || null;
    }

    if (role === "admin" || role === "purchaser") {
      if (!companyId) {
        return NextResponse.json({ error: 'Missing companyId for admin' }, { status: 400 });
      }

      // ✅ Get current user's contact object by email
      const currentUser = contacts.find((c: any) => c.email === email);

      if (!currentUser) {
        return NextResponse.json({ error: 'Access denied: user not part of company contacts' }, { status: 403 });
      }

      if (!['admin', 'purchaser'].includes(currentUser.b2bRole)) {
        return NextResponse.json({ error: 'Access denied: user must have role admin or purchaser' }, { status: 403 });
      }

      const contactEmails =
        contacts?.map((c: any) => c?.email).filter(Boolean) || [];
      if (contactEmails.length === 0) {
        return NextResponse.json({ orders: [] });
      }

      // 🔹 Build OR query from all emails
      query = contactEmails.map((mail: string) => `email:"${mail}"`).join(" OR ");

    } else {
      // Regular customer: fetch only their orders
      query = `email:${email}`;
    }

    const variables = {
      first: 250,
      query,
    };

    const data = await shopifyFetch(GET_CUSTOMER_ORDERS, variables);
    const orders =
      data?.orders?.edges?.map(({ node }: any) => ({
        id: node.id,
        name: node.name,
        createdAt: node.createdAt,
        displayFinancialStatus: node.displayFinancialStatus,
        displayFulfillmentStatus: node.displayFulfillmentStatus,
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
