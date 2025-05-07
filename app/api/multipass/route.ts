// app/api/multipass/route.ts
import { NextResponse } from 'next/server';
// @ts-ignore
import Multipassify from 'multipassify';

export async function POST(request: Request) {
    // 1. Parse JSON body
    const { email, password } = await request.json();

    // 2. Validate credentials (replace with your real logic or database)
    const dummyUser = { email: 'user@example.com', password: 'pass123' };
    if (email !== dummyUser.email || password !== dummyUser.password) {
        // Invalid login
        return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
        );
    }

    // 3. Get Shopify Multipass settings from environment
    const secret = process.env.SHOPIFY_MULTIPASS_SECRET;
    const shopDomain = process.env.SHOPIFY_DOMAIN;
    if (!secret || !shopDomain) {
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    // 4. Generate the Multipass token and URL
    const multipass = new Multipassify(secret);
    // Prepare customer data; at minimum include email.
    // We also use return_to to send the user to their account page after login.
    const customerData = {
        email,
        return_to: `https://${shopDomain}/account`
    };
    // Generate a Multipass login URL, e.g.:
    //   https://yourshopname.myshopify.com/account/login/multipass/<token>
    const multipassUrl = multipass.generateUrl(customerData, shopDomain);

    // 5. Respond with the URL
    return NextResponse.json({ url: multipassUrl });
}
