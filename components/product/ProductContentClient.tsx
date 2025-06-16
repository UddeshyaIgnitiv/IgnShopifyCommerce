'use client';

import { Gallery } from 'components/product/gallery';
import { ProductDescription } from 'components/product/product-description';
import type { Product } from 'lib/shopify/types';
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
            <Gallery
                images={product.images.slice(0, 5).map((img) => ({
                    src: img.url,
                    altText: img.altText,
                }))}
            />
            <ProductDescription product={product} />
        </>
    )
}
