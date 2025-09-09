
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-04';

export async function POST(req: NextRequest) {
  try {
    const { companyId, firstLocations = 5, firstCatalogs = 5 } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
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
          query companyLocations($id: ID!, $firstLocations: Int!, $firstCatalogs: Int!) {
            company(id: $id) {
              locations(first: $firstLocations) {
                edges {
                  node {
                    id
                    name
                    catalogs(first: $firstCatalogs) {
                      edges {
                        node {
                          id
                          title
                          status
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          id: companyId,
          firstLocations,
          firstCatalogs,
        },
        }),
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      return NextResponse.json(
        { error: result.errors ?? result },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Shopify companyLocation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

