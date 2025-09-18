import { ProductOption } from 'app/types/product';
import { NextResponse } from 'next/server';

interface ShopifyGraphQLResponse {
  data?: {
    products: {
      edges: Array<{
        node: {
          id: string;
          availableForSale: Boolean;
          title: string;
          images: {
            edges: Array<{
              node: {
                originalSrc: string;
                altText?: string;
              };
            }>;
          };
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

  if (!query) {
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
            products(first: 100, query: $searchQuery) {
              edges {
                node {
                  id
                  availableForSale
                  title
                  images(first: 1) {
                    edges {
                      node {
                        originalSrc
                        altText
                      }
                    }
                  }
                  variants(first: 50) {
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
      const imageNode = edge.node.images?.edges?.[0]?.node;
      const imageSrc = imageNode?.originalSrc || '';
      const imageAlt = imageNode?.altText || edge.node.title;
      const availableForSale = edge.node.availableForSale;

      edge.node.variants.edges.forEach((variant) => {
        const product: ProductOption = {
          title: `${edge.node.title} - ${variant.node.title}`,
          variantId: variant.node.id,
          imageSrc,
          imageAlt,
          availableForSale,
        };
        products.push(product);
      });
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
