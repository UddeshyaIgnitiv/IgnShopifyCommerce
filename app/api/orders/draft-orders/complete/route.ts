// app\api\orders\draft-orders\complete\route.ts

import COMPLETE_DRAFT_ORDER from 'lib/shopify/mutations/orders/completeDraftOrder';
import TAGS_ADD_MUTATION from 'lib/shopify/mutations/tagsAdd';
import TAGS_REMOVE_MUTATION from 'lib/shopify/mutations/tagsRemove';
import { shopifyFetch } from 'lib/shopify_service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { draftOrderId } = await req.json();

    if (!draftOrderId) {
      return NextResponse.json({ error: 'Draft Order ID is required' }, { status: 400 });
    }

    // 1. Complete the draft order via GraphQL mutation
    const data = await shopifyFetch(COMPLETE_DRAFT_ORDER, { id: draftOrderId });
    const errors = data?.draftOrderComplete?.userErrors;

    if (errors?.length) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const completedDraftOrder = data.draftOrderComplete.draftOrder;

    // 2. Add "approved" tag using tagsAdd GraphQL mutation
    const tagResponse = await shopifyFetch(TAGS_ADD_MUTATION, {
      id: draftOrderId,
      tags: ['approved'],
    });

    const tagErrors = tagResponse?.tagsAdd?.userErrors;
    if (tagErrors?.length) {
      return NextResponse.json(
        { error: 'Tag update error', details: tagErrors },
        { status: 500 }
      );
    }

    // 3. Remove "awaiting_approval" tag
    const tagRemoveResponse = await shopifyFetch(TAGS_REMOVE_MUTATION, {
      id: draftOrderId,
      tags: ['awaiting_approval'],
    });

    const tagRemoveErrors = tagRemoveResponse?.tagsRemove?.userErrors;
    if (tagRemoveErrors?.length) {
      return NextResponse.json(
        { error: 'Tag remove error', details: tagRemoveErrors },
        { status: 500 }
      );
    }

    // 4. Return success with draft order info
    return NextResponse.json({
      message: '✅ Draft order Approved & completed and tag updated successfully.',
      draftOrder: completedDraftOrder,
    });
  } catch (error) {
    console.error('❌ Error completing draft order or adding tag:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
