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
import { Suspense } from 'react';



export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const companyLocationId = (await cookies()).get('companyLocationId')?.value;

  if (!companyLocationId) return notFound();

  // Get the product via Storefront API to get the Admin ID
  const storefrontProduct = await getProduct(params.handle); // Storefront version

   if (!storefrontProduct?.id) return notFound();

  const product = await getProduct(params.handle, undefined, true, companyLocationId, storefrontProduct.id);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
          images: [{ url, width, height, alt }],
        }
      : null,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const { handle } = params;
  const companyLocationId = (await cookies()).get('companyLocationId')?.value;

  const storefrontProduct = await getProduct(handle);
  if (!storefrontProduct?.id) return notFound();

  const adminProduct = companyLocationId
    ? await getProduct(handle, undefined, true, companyLocationId, storefrontProduct.id)
    : null;

  const product = { ...storefrontProduct };

  if (adminProduct?.variants?.length) {
    const prices = adminProduct.variants.map((v) => Number(v?.price?.amount));
    if (prices?.length) {
      product.priceRange = {
        maxVariantPrice: {
          ...product.priceRange.maxVariantPrice,
          amount: Math.max(...prices).toString(),
        } as Money,
        minVariantPrice: {
          ...product.priceRange.minVariantPrice,
          amount: Math.min(...prices).toString(),
        } as Money,
      };
    }

    for (const adminVariant of adminProduct.variants) {
      const match = product.variants.find((v) => v.id === adminVariant.id);
      if (match) {
        match.price = adminVariant?.contextualPricing?.price;
      }
    }
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.featuredImage?.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
    },
  };

  return (
    <ProductProvider variants={product.variants}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <ProductContentClient initialProduct={product} handle={handle} />
          </div>

          <div className="basis-full lg:basis-2/6">
            <Suspense fallback={null}>
              <ProductDescription product={product} />
            </Suspense>
          </div>
        </div>

        <RelatedProducts id={product.id} />
      </div>
      <Footer />
    </ProductProvider>
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
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
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
