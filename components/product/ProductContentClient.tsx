'use client';

import { useState } from 'react'
import type { Product } from 'lib/shopify/types'
import RefreshProduct from './RefreshProduct'
import { Gallery } from 'components/product/gallery'
import { ProductDescription } from 'components/product/product-description'

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
