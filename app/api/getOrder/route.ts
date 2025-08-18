
import { GET_ORDER } from 'lib/shopify/queries/getOrder'
import { GetOrderVariables } from 'lib/shopify/types'
import { shopifyFetch } from 'lib/shopify_service'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const orderId = url.searchParams.get('id')

        //console.log("This is order ID ---> ", orderId);

        if (!orderId) {
            return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
        }

        const cookieStore = cookies()
        const emailRaw = (await cookieStore).get('user_email')?.value
        const email = emailRaw ? decodeURIComponent(emailRaw) : null

        if (!email) {
            return NextResponse.json({ error: 'Missing customer email' }, { status: 400 })
        }

        const variables: GetOrderVariables = { id: orderId }

        const data = await shopifyFetch(GET_ORDER, variables)

        if (!data?.order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json({ order: data.order })
    } catch (error) {
        console.error('❌ Error fetching order:', error)
        return NextResponse.json(
            { error: 'Failed to fetch order', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
