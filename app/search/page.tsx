import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';
import { getProducts } from 'lib/shopify';
import { cookies } from 'next/headers';

type ShopifyProduct = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  tags: string[];
  variants: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: { amount: string; currencyCode: string };
  }[];
};

function buildOrderPayload(
  products: ShopifyProduct[],
  customer_number: number,
  ship_to_code: string
) {
  return {
    customer_number,
    products: products.map((p) => ({
      quantity_ordered: 0,
      sku: p.tags?.[0] || "", // take SKU from first tag
      warehouse_code: "10", // static, can be replaced with logic
    })),
    ship_to_code,
  };
}

function extractIdFromGid(gid: string): string {
  return gid.split("/").pop() || "";
}

export const metadata = {
  title: 'Search',
  description: 'Search for products in the store.'
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: searchValue } = searchParams as { [key: string]: string };

  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  const companyLocationId = (await cookies()).get('companyLocationId')?.value;

  // Use Admin API if location is available
  const products = await getProducts({
    sortKey,
    reverse,
    query: searchValue,
    useAdminAPI: !!companyLocationId,
    companyLocationId
  });

  const shopifyProducts = products;
  const external_company_id = (await cookies()).get('external_company_id')?.value || "";
  const id = extractIdFromGid(companyLocationId ?? "");
  const payload = buildOrderPayload(shopifyProducts, Number(external_company_id), id);

  let customPrices;
    if(companyLocationId){
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (!baseUrl) {
            throw new Error("Missing NEXT_PUBLIC_SITE_URL environment variable.");
        }
        // Call your custom API endpoint from the server component.
        const response = await fetch(`${baseUrl}/api/customprice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          // Use no-store to ensure this call is always fresh and not cached
          cache: 'no-store'
        });

        const data = await response.json();

        if (response.ok) {
          customPrices = data;
        } else {
          console.error(`Failed to fetch custom prices: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error calling custom price API:', error);
      }
    }

  const resultsText = products.length > 1 ? 'results' : 'result';

  return (
    <>
      {searchValue ? (
        <p className="mb-4">
          {products.length === 0
            ? 'There are no products that match '
            : `Showing ${products.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}
      {products.length > 0 ? (
          <ProductGridItems products={products} customPrices={customPrices} />
      ) : null}
    </>
  );
}
