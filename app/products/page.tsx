// app/products/page.tsx
import { shopifyFetch } from 'lib/shopify_service';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

const GET_PRODUCTS_QUERY = `
  query getProducts($companyLocationId: ID!) {
    products(first: 100) {
      edges {
        node {
          id
          handle
          title
          featuredImage {
            url
            altText
          }
          variants(first: 1) {
            edges {
              node {
                contextualPricing(context: { companyLocationId: $companyLocationId }) {
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface ProductNode {
  id: string;
  handle: string;
  title: string;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  variants: {
    edges: {
      node: {
        contextualPricing: {
          price: {
            amount: string;
            currencyCode: string;
          } | null;
        } | null;
      };
    }[];
  };
}

export default async function ProductsPage() {
  const cookieStore = cookies();
  const companyLocationId =
    (await cookieStore).get('companyLocationId')?.value ||
    'gid://shopify/CompanyLocation/1888420054';

  try {
    const data = await shopifyFetch(GET_PRODUCTS_QUERY, { companyLocationId });
    const products: ProductNode[] = data.products.edges.map((edge: any) => edge.node);

    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Products</h1>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const variant = product.variants.edges[0]?.node;
            const price = variant?.contextualPricing?.price;

            return (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
              >
                {product.featuredImage && (
                  <div className="relative w-full h-56 mb-4 rounded overflow-hidden bg-white border">
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText || product.title}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>
                )}

                <h2 className="text-lg font-medium text-gray-900 truncate mb-2">
                  {product.title}
                </h2>

                <p className="text-gray-700 text-sm">
                  {price ? `${price.amount} ${price.currencyCode}` : 'Price not available'}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return (
      <main className="p-6">
        <p className="text-red-600">Failed to load products.</p>
      </main>
    );
  }
}
