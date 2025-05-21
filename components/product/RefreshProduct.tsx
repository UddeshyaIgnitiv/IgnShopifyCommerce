'use client';

import { useEffect } from 'react'
import type { Product } from 'lib/shopify/types'

export default function RefreshProduct({
    handle,
    onUpdate,
}: {
    handle: string
    onUpdate: (p: Product) => void
}) {
    useEffect(() => {
        // 1) grab customer token cookie
        const token = document.cookie
            .split('; ')
            .find((c) => c.startsWith('shopify_access_token='))
            ?.split('=')[1]
        if (!token) return

        // 2) re-fetch via our API with header
        fetch(`/api/product?handle=${handle}`, {
            headers: { 'Shopify-Customer-Access-Token': token },
            credentials: 'include',
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.product) onUpdate(data.product)
            })
            .catch(console.error)
    }, [handle, onUpdate])

    return null
}
