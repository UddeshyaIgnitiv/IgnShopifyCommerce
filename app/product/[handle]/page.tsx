import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { GridTileImage } from 'components/grid/tile';
import Footer from 'components/layout/footer';
import { ProductProvider } from 'components/product/product-context';
import { ProductDescription } from 'components/product/product-description';
import ProductContentClient from 'components/product/ProductContentClient';
import { HIDDEN_PRODUCT_TAG } from 'lib/constants';
import { getProduct, getProductRecommendations } from 'lib/shopify';

import { Money } from 'lib/shopify/types';
import Link from 'next/link';
import PlaceHolderImage from 'public/noImage.png';
import { Suspense } from 'react';

function extractIdFromGid(gid: string): string {
  return gid.split("/").pop() || "";
}


export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const companyLocationId = (await cookies()).get('companyLocationId')?.value;

  if (!companyLocationId) {
    return {
      title: "Product Not Found",
      description: "No product found for this location.",
    };
  }

  // Get the product via Storefront API to get the Admin ID
  const storefrontProduct = await getProduct(params.handle); // Storefront version

  if (!storefrontProduct?.id) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }

  const product = await getProduct(params.handle, undefined, true, companyLocationId, storefrontProduct.id);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }


  const { url, width, height, altText: alt } = product.featuredImage || PlaceHolderImage;
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable
      }
    },
    openGraph: url
      ? {
        images: [
          {
            url,
            width,
            height,
            alt
          }
        ]
      }
      : null
  };
}

export default async function ProductPage(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const { handle } = await params;
  const companyLocationId = (await cookies()).get('companyLocationId')?.value;
  const shopify_id_token = (await cookies()).get('shopify_id_token')?.value;

  // if (!companyLocationId) return notFound();

  const external_company_id = (await cookies()).get('external_company_id')?.value || "";
  // console.log("external_company_id", external_company_id);
  // console.log("companyLocationId", companyLocationId);

  const externalID = extractIdFromGid(companyLocationId ?? "");

  if (!companyLocationId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-center text-lg font-bold">
          Please Login to View Product
        </p>
      </div>
    );
  }

  if (!shopify_id_token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-center text-lg font-bold">
          Please Login to View Product
        </p>
      </div>
    );
  }

  // Get the product via Storefront API to get the Admin ID

  const product = await getProduct(params.handle); // Storefront version

  // if (!product?.id) return notFound();

  if (!product?.id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-center text-lg font-bold">
          Product Not Found
        </p>
      </div>
    );
  }

  const adminProduct = await getProduct(params.handle, undefined, true, companyLocationId, product.id);

  if (!adminProduct) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-center text-lg font-bold">
          Product Not Found
        </p>
      </div>
    );
  }

  const prices = adminProduct?.variants?.map(variant => Number(variant?.price?.amount)) as number[];

  product.priceRange = {
    maxVariantPrice: {
      ...product.priceRange.maxVariantPrice,
      amount: Math.max(...prices)?.toString(),
    } as Money,
    minVariantPrice: {
      ...product.priceRange.minVariantPrice,
      amount: Math.min(...prices)?.toString(),
    } as Money
  };

  if (adminProduct?.variants && product?.variants) {

    for (const adminProdVariant of adminProduct?.variants) {

      const matchingVariant = product.variants.find(
        variant => variant.id === adminProdVariant.id
      );
      if (matchingVariant) {
        matchingVariant.price = adminProdVariant?.contextualPricing?.price;
      }

    }

  }

  let customPrices;
  try {
    // Extract SKUs from the product variants.
     const skus = product.tags[0];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
        throw new Error("Missing NEXT_PUBLIC_SITE_URL environment variable.");
    }
    if (!external_company_id) {
      throw new Error("Missing external_company_id cookie.");
    }
    if (!externalID) {
      throw new Error("Missing externalID cookie.");
    }
    // Call your custom API endpoint from the server component.
    const response = await fetch(`${baseUrl}/api/customprice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "customer_number": Number(external_company_id),
        "products": [
          {
            "quantity_ordered": 0,
            "sku": skus,
            "warehouse_code": "10"
          }
        ],
        "ship_to_code": externalID
      }),
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

  if (customPrices && customPrices.prices > 0 && customPrices.prices.length > 0) {
    // Find the custom price for this product.
    // Adjust the matching key if required.
    // console.log("customPrices", customPrices);
    const customPriceItem = customPrices.prices.find((item: any) => item.product === product.tags[0]);

    if (customPriceItem) {
      product.priceRange = {
        maxVariantPrice: {
          ...product.priceRange.maxVariantPrice,
          amount: customPriceItem.price.toString(),
          currencyCode: product.priceRange.maxVariantPrice.currencyCode // Use the product default or a fixed currency if desired
        } as Money,
        minVariantPrice: {
          ...product.priceRange.minVariantPrice,
          amount: customPriceItem.price.toString(),
          currencyCode: product.priceRange.minVariantPrice.currencyCode // Use the product default or a fixed currency if desired
        } as Money
      };
    }
  }



  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/product-variant/metafield`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerId: product.variants[0]? product.variants[0].id : '',
    }),
  });

  const inventoryResult = await response.json();
  console.log('Metafield value:', inventoryResult.metafield);

  if (!product) return notFound();

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.featuredImage ? product.featuredImage.url : PlaceHolderImage.src,
    offers: {
      '@type': 'AggregateOffer',
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount
    }
  };

  return (
    <>
      {adminProduct ? (
        <ProductProvider variants={product.variants}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(productJsonLd),
            }}
          />
          <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
            <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
              {/* <div className="h-full w-full basis-full lg:basis-4/6">
              <Suspense
                fallback={
                  <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
                }
              >
                <Gallery
                  images={product.images.slice(0, 5).map((image: Image) => ({
                    src: image.url,
                    altText: image.altText
                  }))}
                />
              </Suspense>
            </div> */}

              <div className="h-full w-full basis-full lg:basis-4/6">
                <ProductContentClient
                  initialProduct={product}
                  handle={handle}
                />
              </div>

              <div className="basis-full lg:basis-2/6">
                <Suspense fallback={null}>
                  <ProductDescription
                    product={product}
                    inventoryResult={inventoryResult.metafield}
                  />
                </Suspense>
              </div>
            </div>
            <RelatedProducts id={product.id} />
          </div>
          <Footer />
        </ProductProvider>
      ) : (
        <h1>Product Not Found</h1>
      )}
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);

  if (!relatedProducts.length) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product) => (
          <li
            key={product.handle}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link
              className="relative h-full w-full"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
