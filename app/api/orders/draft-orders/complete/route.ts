// app/api/orders/draft-orders/complete/route.ts
import COMPLETE_DRAFT_ORDER from 'lib/shopify/mutations/orders/completeDraftOrder';
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(req: NextRequest) {
  try {
    const { draftOrderId } = await req.json();

    if (!draftOrderId) {
      return NextResponse.json({ error: 'Draft Order ID is required' }, { status: 400 });
    }

    const data = await shopifyFetch(COMPLETE_DRAFT_ORDER, { id: draftOrderId });
    const errors = data?.draftOrderComplete?.userErrors;

    if (errors?.length) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json({
      message: '✅ Draft order completed successfully.',
      order: data.draftOrderComplete.order,
    });
  } catch (error) {
    console.error('❌ Error completing draft order:', error);
    return NextResponse.json({ error: 'Server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
