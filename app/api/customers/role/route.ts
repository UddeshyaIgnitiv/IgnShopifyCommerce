// app/api/customers/role/route.ts

import { GET_CUSTOMER_ROLE_ADMIN } from 'app/graphql/queries';
import { GET_CUSTOMER_ROLE } from 'lib/shopify/queries/getCustomer';
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_CUSTOMER_API = `https://shopify.com/${process.env.SHOPIFY_SHOPID}/account/customer/api/unstable/graphql.json`;

/**
 * Fetches customer role using the Shopify Customer Account API
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ Step 1: Get token from cookie (shopify_access_token)
    const customerAccessToken = req.cookies.get('shopify_access_token')?.value;

    console.log('[ROLE API] shopify_access_token:', customerAccessToken);

    if (!customerAccessToken) {
      console.warn('[ROLE API] Missing shopify_access_token cookie');
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    // ✅ Step 2: Call Shopify API using token from cookie
    const customerRes  = await fetch(SHOPIFY_CUSTOMER_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerAccessToken}`, // Pass the token directly to Shopify in the Authorization header
      },
      body: JSON.stringify({ query: GET_CUSTOMER_ROLE }),
    });

    const customerData = await customerRes.json();
    const customerId = customerData?.data?.customer?.id;
    const email = customerData?.data?.customer?.email;
    console.log('customerData', customerData);
    console.log('customerId', customerId);
    console.log('email', email);

    if (!customerRes) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }


    // Step 3: Fetch metafields using Admin API (with customer ID)
    const adminRes = await shopifyFetch(GET_CUSTOMER_ROLE_ADMIN, { id: customerId });

    // ✅ Step 3: Extract metafield "role"
    const adminData = await adminRes.json();
    const metafields = adminData?.data?.customer?.metafields?.edges || [];

    console.log('[ROLE API] Metafields:', metafields);

    // ✅ Step 4: Extract 'role' metafield
    const role = metafields.find(
      (edge: { node: { key: string } }) => edge.node?.key === 'role'
    )?.node?.value;

    console.log('[ROLE API] Extracted Role:', role);

    if (!role) {
      return NextResponse.json({ error: 'Role not found for the customer' }, { status: 404 });
    }

    return NextResponse.json({ customerId, email, role });
  } catch (error) {
    console.error('[ROLE API] Unexpected Error:', error);
    return NextResponse.json({ error: 'Server error fetching customer role' }, { status: 500 });
  }
}
