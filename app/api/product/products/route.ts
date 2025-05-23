import { ProductOption } from 'app/types/product';
import { NextResponse } from 'next/server';

interface ShopifyGraphQLResponse {
  data?: {
    products: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          variants: {
            edges: Array<{
              node: {
                id: string;
                title: string;
              };
            }>; 
          };
        };
      }>;
    };
  };
  errors?: any;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query')?.trim();

  console.log('[API] Received query:', query);

  if (!query) {
    console.log('[API] No query provided, returning 400');
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(process.env.SHOPIFY_STOREFRONT_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      },
      body: JSON.stringify({
        query: `
          query($searchQuery: String!) {
            products(first: 5, query: $searchQuery) {
              edges {
                node {
                  id
                  title
                  variants(first: 5) {
                    edges {
                      node {
                        id
                        title
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          searchQuery: `title:*${query}*`,
        },
      }),
    });

    console.log('[API] Shopify response status:', response.status);

    const data: ShopifyGraphQLResponse = await response.json();

    if (data.errors) {
      console.error('[API] Shopify API errors:', data.errors);
      return NextResponse.json({ error: 'Failed to fetch products from Shopify' }, { status: 500 });
    }

    if (!data.data) {
      console.error('[API] No data in Shopify response');
      return NextResponse.json({ error: 'No data returned from Shopify' }, { status: 500 });
    }

    const products: ProductOption[] = [];

    data.data.products.edges.forEach((edge) => {
      edge.node.variants.edges.forEach((variant) => {
        const product = {
          title: `${edge.node.title} - ${variant.node.title}`,
          variantId: variant.node.id,
        };
        console.log('[API] Adding product:', product);
        products.push(product);
      });
    });

    console.log('[API] Returning products:', products.length);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
