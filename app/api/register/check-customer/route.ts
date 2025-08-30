// app/api/customer/lookup/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-04';

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function toE164US(phone: string): string {
  // remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // if already in E.164, return as-is
  if (phone.startsWith('+')) return phone;

  // prepend +1 for US
  return `+1${cleaned}`;
}

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, email } = await req.json();

    if (!phoneNumber && !email) {
      return NextResponse.json(
        { error: 'Either phoneNumber or email is required' },
        { status: 400 }
      );
    }

    let identifier: Record<string, string> = {};

    if (phoneNumber) {
      const formattedPhone = toE164US(phoneNumber);

      if (!E164_REGEX.test(formattedPhone)) {
        return NextResponse.json(
          { error: 'phoneNumber must be in E.164 format, e.g. "+13345551234"' },
          { status: 400 }
        );
      }

      identifier = { phoneNumber: formattedPhone };
    } else if (email) {
      identifier = { emailAddress: email };
    }

    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VER}/graphql.json`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: `
          query($identifier: CustomerIdentifierInput!) {
            customer: customerByIdentifier(identifier: $identifier) {
                id
                email
                phone
                firstName
                lastName
            }
          }
        `,
        variables: { identifier },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json(
        { error: result.errors },
        { status: 400 }
      );
    }
    if (!result.data.customer) {
      return NextResponse.json({ existingCustomer: false });
    }

    return NextResponse.json({ existingCustomer: true  });

  } catch (error) {
    console.error('Shopify fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

