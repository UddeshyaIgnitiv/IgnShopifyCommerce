import { NextResponse } from 'next/server'
import { getProduct } from 'lib/shopify'

export async function GET(req: Request) {
    const url = new URL(req.url)
    const handle = url.searchParams.get('handle')
    if (!handle)
        return NextResponse.json({ error: 'Missing handle' }, { status: 400 })

    // read token from header
    const token = req.headers.get('Shopify-Customer-Access-Token') ?? undefined

    const product = await getProduct(handle, token)
    if (!product)
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    return NextResponse.json({ product })
}
