import { SEND_INVITE_MUTATION } from 'lib/shopify/mutations/customerSendAccountInviteEmail';
import { shopifyFetch } from 'lib/shopify_service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerId } = body;

    // ✅ Validate input
    const errors: { field: string; message: string }[] = [];

    if (!customerId) {
      errors.push({ field: 'customerId', message: 'Customer ID is required.' });
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const inviteRes = await shopifyFetch(SEND_INVITE_MUTATION, { customerId });

    const userErrors = inviteRes?.customerSendAccountInviteEmail?.userErrors ?? [];
    const customer = inviteRes?.customerSendAccountInviteEmail?.customer;

    if (userErrors.length > 0) {
      const formattedErrors = userErrors.map((e: any) => ({
        field: e.field?.[0] || 'customerId',
        message: e.message,
      }));
      return NextResponse.json({ error: formattedErrors }, { status: 400 });
    }

    return NextResponse.json({
      message: '✅ Invite email sent successfully.',
      customer,
    });

  } catch (error: unknown) {
    console.error('Error sending invite email:', error);
    return NextResponse.json(
      {
        error: [
          {
            field: 'server',
            message: error instanceof Error ? error.message : 'Unexpected server error.',
          },
        ],
      },
      { status: 500 }
    );
  }
}
