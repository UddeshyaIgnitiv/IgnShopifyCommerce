import { createCart, getCart, shopifyFetch } from 'lib/shopify';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        const cookieStore = cookies();
        const customerAccessToken = (await cookieStore).get('shopify_access_token')?.value;
        const companyLocationId = (await cookieStore).get('companyLocationId')?.value;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 });
        }

        // Ensure cart exists
        let cart = await getCart();

        if (!cart || !cart.id) {
            cart = await createCart({
                customerAccessToken,
                companyLocationId
            }); // createCart requires an object, pass empty
        }

        const lines = items.map((item: any) => ({
            merchandiseId: item.variantId,
            quantity: item.quantity,
        }));

        const mutation = `
            mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
                cartLinesAdd(cartId: $cartId, lines: $lines) {
                cart {
                    id
                    totalQuantity
                }
                userErrors {
                    field
                    message
                }
                }
            }
        `;

        const res = await shopifyFetch({ query: mutation, variables: { cartId: cart.id, lines } });

        const body = res.body as {
            data: {
                cartLinesAdd: {
                    cart: { id: string; totalQuantity: number };
                    userErrors: { field: string[]; message: string }[];
                };
            };
        };

        // console.dir(res, { depth: null });

        if (body.data.cartLinesAdd.userErrors.length > 0) {
            return NextResponse.json({ error: body.data.cartLinesAdd.userErrors }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'Products added to cart',
            cart: body.data.cartLinesAdd.cart,
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
