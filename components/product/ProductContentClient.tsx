'use client';

import { Gallery } from 'components/product/gallery';
import type { Product } from 'lib/shopify/types';
import PlaceHolderImage from 'public/noImage.png';
import { useState } from 'react';
import RefreshProduct from './RefreshProduct';

export default function ProductContentClient({
    initialProduct,
    handle,
}: {
    initialProduct: Product
    handle: string
}) {
    // start with SSR/fresh data
    const [product, setProduct] = useState(initialProduct)

    return (
      <>
        {/* will trigger one re-fetch when token appears */}
        <RefreshProduct handle={handle} onUpdate={setProduct} />

        {/* now render with up-to-date `product` */}
        { product.images && product.images.length > 0 && (
            <Gallery
            images={product.images.slice(0, 5).map((img) => ({
                src: img.url ? img.url : PlaceHolderImage.src,
                altText: img.altText,
            }))}
            />
        )}
        {!product.images || product.images.length === 0 && (
            <Gallery
            images={[{ src: PlaceHolderImage.src, altText: 'No image available' }]}
            />
        )}
        
        {/* <ProductDescription product={product} /> */}
      </>
    );
}
