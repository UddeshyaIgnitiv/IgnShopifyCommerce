// app/api/customer/route.ts

import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles the POST request to fetch customer data from Shopify GraphQL API
 */
export async function POST(request: NextRequest) {
  // Get cookies header and default to empty string if undefined
  const cookieHeader: string = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/shopify_access_token=([^;]*)/);
  const token = match?.[1];

  console.log("token", token);

  if (!token) {
    return NextResponse.json({ error: 'No customer access token found.' }, { status: 401 });
  }

  const query = `
    query {
      customer {
        id
        firstName
        email
        metafields(namespace: "b2b", keys: ["role"]) {
          key
          value
        }
      }
    }
  `;

  try {
    const response = await fetch('https://ignitiv-demo-store.myshopify.com/customer/api/2025-04/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Shopify-Customer-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    console.log("result", result);

    if (result.errors) {
      return NextResponse.json({ error: result.errors }, { status: 500 });
    }

    return NextResponse.json(result.data?.customer || {}, { status: 200 });
  } catch (error) {
    console.error('GraphQL error:', error);
    return NextResponse.json({ error: 'Error fetching customer data' }, { status: 500 });
  }
}
