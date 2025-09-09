import { getCollection, getCollectionProducts } from 'lib/shopify';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';

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

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = await getCollection(params.collection);
  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description || collection.description || `${collection.title} products`
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const { sort } = searchParams as { [key: string]: string };
    const { sortKey, reverse } =
      sorting.find((item) => item.slug === sort) || defaultSort;

    const companyLocationId = (await cookies()).get('companyLocationId')?.value;

    const products = await getCollectionProducts({
      collection: params.collection,
      sortKey,
      reverse,
      useAdminAPI: !!companyLocationId,
      companyLocationId
    });

    // console.log("products", products);

    const shopifyProducts = products;
    const external_company_id = (await cookies()).get('external_company_id')?.value || "";
    // console.log("external_company_id", external_company_id);
    // console.log("companyLocationId", companyLocationId);

    
    const id = extractIdFromGid(companyLocationId ?? "");

    // console.log(id);

    const payload = buildOrderPayload(shopifyProducts, Number(external_company_id), id);

    // console.log(JSON.stringify(payload, null, 2));


    let customPrices;
    if(companyLocationId){
      try {
        // Extract SKUs from the product variants.
        // const skus = product.tags[0];
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
   

    // console.log("customPrices", customPrices);

    return (
      <section>
        {products.length === 0 ? (
          <p className="py-3 text-lg">{`No products found in this collection`}</p>
        ) : (
            <ProductGridItems products={products} customPrices={customPrices} />
        )}
      </section>
    );
  } catch (error: any) {
    console.error('Error in CategoryPage:', error);
    return <p className="py-3 text-lg">An error occurred while loading the collection.</p>;
  }
}
