// app/api/orders/complete-order/route.ts
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  try {
    const { draftOrderId } = await req.json();

    if (!draftOrderId) {
      return NextResponse.json({ error: 'Draft Order ID is required' }, { status: 400 });
    }

    const SHOPIFY_ADMIN_API_URL = `https://ignitiv-demo-store.myshopify.com/admin/api/2025-04/draft_orders/${draftOrderId}/complete.json`;

    const response = await fetch(SHOPIFY_ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: 'Shopify error', details: err }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error completing order via REST:', error);
    return NextResponse.json({ error: 'Server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
