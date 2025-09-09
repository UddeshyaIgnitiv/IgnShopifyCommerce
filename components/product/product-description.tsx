'use client';

import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Prose from 'components/prose';
import { Product } from 'lib/shopify/types';
import InventorySelect from './inventorySelector';
import { useProduct } from './product-context';
import { VariantSelector } from './variant-selector';

export function ProductDescription({ product, inventoryResult }: { product: Product, inventoryResult?: any }) {
  const { selectedVariant, isLoading } = useProduct();

  console.log("This is product data --> ", product);

  //console.log('🔵 Rendering ProductDescription. Selected Variant:', selectedVariant);

  if (isLoading) {
    // Show loading UI or fallback while selectedVariant is not ready
    return <div>Loading product details...</div>;
  }

  const price = selectedVariant?.price ?? product.priceRange.maxVariantPrice;
  //console.log('💰 Displayed Price:', price);

  return (
    <>
      <div className="mb-8 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-3 text-4xl font-medium">{product.title}</h1>
        <div className="mr-auto w-auto bg-transparent p-2 text-xl font-bold text-primary">
          <Price amount={price.amount} currencyCode={price.currencyCode} />
        </div>
      </div>

      <VariantSelector options={product.options} variants={product.variants} />

      {product.descriptionHtml ? (
        <Prose
          className="mb-12 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <p className='mb-4 font-medium'>
        {" "}
        Available Product Stock:{" "}
        {inventoryResult.inventoryQuantity}{" "}
      </p>
      <InventorySelect
        inventoryLevels={inventoryResult.inventoryItem.inventoryLevels.edges}
      />
      <AddToCart product={product} />
    </>
  );
}
