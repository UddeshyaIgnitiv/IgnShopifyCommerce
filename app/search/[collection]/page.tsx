// import { getCollection, getCollectionProducts } from 'lib/shopify';
// import { Metadata } from 'next';
// import { cookies } from 'next/headers';

// import ProductGridItems from 'components/layout/product-grid-items';
// import { defaultSort, sorting } from 'lib/constants';

// type ShopifyProduct = {
//   id: string;
//   handle: string;
//   availableForSale: boolean;
//   title: string;
//   tags: string[];
//   variants: {
//     id: string;
//     title: string;
//     availableForSale: boolean;
//     price: { amount: string; currencyCode: string };
//   }[];
// };

// function buildOrderPayload(
//   products: ShopifyProduct[],
//   customer_number: number,
//   ship_to_code: string
// ) {
//   return {
//     customer_number,
//     products: products.map((p) => ({
//       quantity_ordered: 0,
//       sku: p.tags?.[0] || "", // take SKU from first tag
//       warehouse_code: "10", // static, can be replaced with logic
//     })),
//     ship_to_code,
//   };
// }

// function extractIdFromGid(gid: string): string {
//   return gid.split("/").pop() || "";
// }


// export async function generateMetadata(props: {
//   params: Promise<{ collection: string }>;
// }): Promise<Metadata> {
//   const params = await props.params;
//   const collection = await getCollection(params.collection);
//   if (!collection) return {
//       title: "Collection Not Found",
//       description: "No Collection found.",
//     };

//   return {
//     title: collection.seo?.title || collection.title,
//     description:
//       collection.seo?.description || collection.description || `${collection.title} products`
//   };
// }

// export default async function CategoryPage(props: {
//   params: Promise<{ collection: string }>;
//   searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
// }) {
//   // React's special postpone symbol for Next.js 15 prerendering
//   const postponeSymbol = Symbol.for('react.postpone');

//   let searchParams, params;

//   try {
//     [searchParams, params] = await Promise.all([
//       props.searchParams || Promise.resolve({}),
//       props.params
//     ]);
//   } catch (error: any) {
//     // If this is React's "postpone" symbol error, rethrow immediately to let Next.js handle it
//     if (error?.$$typeof === postponeSymbol) {
//       throw error;
//     }
//     console.error('Error accessing route parameters:', error);
//     return <p className="py-3 text-lg">Unable to load page parameters.</p>;
//   }

//   try {
//     const { sort } = searchParams as { [key: string]: string };
//     const { sortKey, reverse } =
//       sorting.find((item) => item.slug === sort) || defaultSort;

//     const companyLocationId = (await cookies()).get('companyLocationId')?.value;

//     const products = await getCollectionProducts({
//       collection: params.collection,
//       sortKey,
//       reverse,
//       useAdminAPI: !!companyLocationId,
//       companyLocationId
//     });

//     const shopifyProducts = products;
//     const external_company_id = (await cookies()).get('external_company_id')?.value || "";

//     const id = extractIdFromGid(companyLocationId ?? "");

//     const payload = buildOrderPayload(shopifyProducts, Number(external_company_id), id);

//     let customPrices;
//     if (companyLocationId) {
//       try {
//         const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
//         if (!baseUrl) {
//           throw new Error("Missing NEXT_PUBLIC_SITE_URL environment variable.");
//         }

//         const response = await fetch(`${baseUrl}/api/customprice`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(payload),
//           cache: 'no-store'
//         });

//         if (response.ok) {
//           customPrices = await response.json();
//         } else {
//           console.error(`Failed to fetch custom prices: ${response.statusText}`);
//         }
//       } catch (error) {
//         console.error('Error calling custom price API:', error);
//       }
//     }

//     return (
//       <section>
//         {products.length === 0 ? (
//           <p className="py-3 text-lg">{`No products found in this collection`}</p>
//         ) : (
//           <ProductGridItems products={products} customPrices={customPrices} />
//         )}
//       </section>
//     );

//   } catch (error: any) {
//     console.error('Error in CategoryPage:', error);
//     return <p className="py-3 text-lg">An error occurred while loading the collection.</p>;
//   }
// }

import { getCollection, getCollectionProducts } from 'lib/shopify';
import { Metadata } from 'next';
import { cookies } from 'next/headers';

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
  const { collection } = await props.params; // ✅ must await
  const collectionData = await getCollection(collection);

  if (!collectionData) {
    return {
      title: "Collection Not Found",
      description: "No Collection found.",
    };
  }

  return {
    title: collectionData.seo?.title || collectionData.title,
    description:
      collectionData.seo?.description ||
      collectionData.description ||
      `${collectionData.title} products`,
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const { collection } = await props.params; // ✅ must await
    const searchParams = (await props.searchParams) || {};
    const { sort } = searchParams as { [key: string]: string };
    const { sortKey, reverse } =
      sorting.find((item) => item.slug === sort) || defaultSort;

    const cookieStore = await cookies();
    const companyLocationId = cookieStore.get("companyLocationId")?.value;
    const external_company_id =
      cookieStore.get("external_company_id")?.value || "";

    const products = await getCollectionProducts({
      collection,
      sortKey,
      reverse,
      useAdminAPI: !!companyLocationId,
      companyLocationId,
    });

    const id = extractIdFromGid(companyLocationId ?? "");
    const payload = buildOrderPayload(
      products,
      Number(external_company_id),
      id
    );

    let customPrices;
    if (companyLocationId && external_company_id) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (!baseUrl) {
          throw new Error(
            "Missing NEXT_PUBLIC_SITE_URL environment variable."
          );
        }

        const response = await fetch(`${baseUrl}/api/customprice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
        });

        if (response.ok) {
          customPrices = await response.json();
        } else {
          const errorText = await response.text();
          console.error(
            `Failed to fetch custom prices: ${response.status} - ${errorText}`
          );
        }
      } catch (error: any) {
        console.error("Error calling custom price API:", error.stack || error);
      }
    }

    return (
      <section>
        {products.length === 0 ? (
          <p className="py-3 text-lg">No products found in this collection</p>
        ) : (
          <ProductGridItems products={products} customPrices={customPrices} />
        )}
      </section>
    );
  } catch (error: any) {
    console.error("Error in CategoryPage:", error.stack || error);
    return (
      <p className="py-3 text-lg">
        An error occurred while loading the collection.
      </p>
    );
  }
}

