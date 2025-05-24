import { NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || '';
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  const graphqlQuery = `
    query searchProducts($query: String!) {
      products(first: 5, query: $query) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  const formattedQuery = `title:${query}`;

  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { query: formattedQuery },
      }),
    });

    const responseBody = await response.json();

    if (!response.ok || !responseBody?.data) {
      return NextResponse.json({ products: [] }, { status: response.status });
    }

    const products =
      responseBody.data.products.edges.map(({ node }: any) => ({
        id: node.id,
        title: node.title,
        handle: node.handle,
        url: `/product/${node.handle}`,
        image: node.images.edges[0]?.node.url || null,
        altText: node.images.edges[0]?.node.altText || '',
      })) || [];

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[API] Shopify product search error:', error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
