// app/api/account/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;

export async function POST(req: NextRequest) {
    try {
        const { id, activationToken, password } = await req.json();

        const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
            },
            body: JSON.stringify({
                query: `
          mutation customerActivate($id: ID!, $input: CustomerActivateInput!) {
            customerActivate(id: $id, input: $input) {
              customer {
                id
                email
              }
              customerUserErrors {
                field
                message
              }
            }
          }
        `,
                variables: {
                    id: `gid://shopify/Customer/${id}`,
                    input: {
                        activationToken,
                        password,
                    },
                },
            }),
        });

        const result = await response.json();

        if (result.errors || result.data.customerActivate.customerUserErrors.length) {
            return NextResponse.json({ error: result }, { status: 400 });
        }

        return NextResponse.json({ success: true, customer: result.data.customerActivate.customer });
    } catch (error) {
        console.error('Activation error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
