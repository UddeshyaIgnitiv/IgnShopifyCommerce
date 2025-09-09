// app/api/product-variant/metafield/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-04';

export async function POST(req: NextRequest) {
  try {
    const { ownerId } = await req.json();

    if (!ownerId) {
      return NextResponse.json(
        { error: 'ownerId are required' },
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
          query ProductVariantInventory($id: ID!) {
            productVariant(id: $id) {
              id
              inventoryQuantity
              inventoryItem{
                locationsCount{
                    count
                }
                inventoryLevels(first: 10) {
                  edges {
                    node {
                        
                        id
                        location {
                            name
                            fulfillsOnlineOrders
                            hasActiveInventory
                            isActive
                            isPrimary
                        }
                        quantities(names:"available") {
                            quantity
                            name
                        }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { id: ownerId },
      }),
    });

    const result = await response.json();

    console.log('GraphQL ProductVariantMetafield response:', result);

    if (result.errors) {
      return NextResponse.json({ error: result.errors }, { status: 400 });
    }

    if (!result.data?.productVariant) {
      return NextResponse.json({ metafield: null });
    }

    return NextResponse.json({
      metafield: result.data.productVariant,
    });
  } catch (error) {
    console.error('Shopify fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
