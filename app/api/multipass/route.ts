// app/api/multipass/route.ts
import { NextResponse } from 'next/server';
// @ts-ignore
import Multipassify from 'multipassify';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Basic validation
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Dummy user (for testing)
        const dummyUser = { email: 'ranjeet.d@ignitiv.com', password: 'Ign@2949' };

        // Check credentials
        if (email !== dummyUser.email || password !== dummyUser.password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Env variables
        const secret = process.env.SHOPIFY_MULTIPASS_SECRET;
        const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;
        const returnPath = process.env.SHOPIFY_RETURN_TO || '/account';

        if (!secret || !shopDomain) {
            console.error('Missing Shopify config:', { hasSecret: !!secret, hasDomain: !!shopDomain });
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        // Generate Multipass token
        const multipass = new Multipassify(secret);
        const customerData = {
            email,
            return_to: `https://${shopDomain}${returnPath}`
        };
        const multipassUrl = multipass.generateUrl(customerData, shopDomain);

        return NextResponse.json({ url: multipassUrl });

    } catch (error) {
        console.error('Multipass API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
