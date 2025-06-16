'use client';

import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Prose from 'components/prose';
import { Product } from 'lib/shopify/types';
import { useProduct } from './product-context';
import { VariantSelector } from './variant-selector';

export function ProductDescription({ product }: { product: Product }) {
  const { selectedVariant, isLoading } = useProduct();

  //console.log('🔵 Rendering ProductDescription. Selected Variant:', selectedVariant);

  if (isLoading) {
    // Show loading UI or fallback while selectedVariant is not ready
    return <div>Loading product details...</div>;
  }

  const price = selectedVariant?.price ?? product.priceRange.maxVariantPrice;
  //console.log('💰 Displayed Price:', price);

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
          <Price
            amount={price.amount}
            currencyCode={price.currencyCode}
          />
        </div>
      </div>

      <VariantSelector options={product.options} variants={product.variants} />

      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}

      <AddToCart product={product} />
    </>
  );
}
