import { SEND_INVITE_MUTATION } from 'lib/shopify/mutations/customerSendAccountInviteEmail';
import { shopifyFetch } from 'lib/shopify_service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerId } = body;

    //console.log("customerId data", customerId);

    // Validate input
    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing required field: customerId' },
        { status: 400 }
      );
    }

    const variables = { customerId };
    const inviteRes = await shopifyFetch(SEND_INVITE_MUTATION, variables);

    //console.log("inviteRes", inviteRes);

    const errors = inviteRes?.customerSendAccountInviteEmail?.userErrors;
    const customer = inviteRes?.customerSendAccountInviteEmail?.customer;

    //console.log("errors", errors);
    //console.log("customer", customer);

    if (errors && errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json({
      message: '✅ Invite email sent successfully.',
      customer,
    });

  } catch (error: unknown) {
    console.error('Error sending invite email:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 }
    );
  }
}
