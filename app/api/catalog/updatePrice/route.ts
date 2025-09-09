// app/api/catalog/updatePrice/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-04';

export async function POST(req: NextRequest) {
  try {
    const  payload  = await req.json();
    console.log('Received payload:', payload);
    const priceListId = payload?.priceListId;
    const prices = payload?.prices;
    console.log('priceListId:', priceListId);
    console.log('prices:', prices);

    if (!priceListId || !prices?.length) {
      return NextResponse.json(
        { error: 'priceListId and prices[] are required' },
        { status: 400 }
      );
    }

    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VER}/graphql.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: `
          mutation priceListFixedPricesAdd(
            $priceListId: ID!
            $prices: [PriceListPriceInput!]!
          ) {
            priceListFixedPricesAdd(priceListId: $priceListId, prices: $prices) {
              prices {
                variant {
                  id
                }
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          priceListId,
          prices,
        },
      }),
    });

    const result = await response.json();
    console.log('Shopify priceListFixedPricesAdd response:', result);

    if (!response.ok || result.errors) {
      return NextResponse.json(
        { error: result.errors ?? result },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data.priceListFixedPricesAdd);
  } catch (err) {
    console.error('Shopify priceListFixedPricesAdd error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
