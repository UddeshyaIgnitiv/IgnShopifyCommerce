// app/api/catalog/get/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-04';

export async function POST(req: NextRequest) {
  try {
    const { catalogId } = await req.json();

    if (!catalogId) {
      return NextResponse.json(
        { error: 'catalogId (Shopify GID) is required' },
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
          query GetCatalog($id: ID!) {
            catalog(id: $id) {
              id
              title
              status
              priceList{
                id
              }
            }
          }
        `,
        variables: { id: catalogId },
      }),
    });

    const result = await response.json();

    console.log("Catalog fetch result:", result);

    if (!response.ok || result.errors) {
      return NextResponse.json(
        { error: result.errors ?? result },
        { status: 400 }
      );
    }

    return NextResponse.json({ catalog: result.data.catalog });
  } catch (err) {
    console.error('Shopify Catalog fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
