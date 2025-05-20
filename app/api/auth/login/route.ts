import { generateNonce, generateState } from "lib/utils/authHelpers";
import { NextResponse } from "next/server";

export async function GET() {
    const client_id: string = process.env.CLIENT_ID!;
    const state = await generateState();
    const nonce = await generateNonce(12);

    const queryParams = new URLSearchParams({
        client_id,
        locale: 'en',
        scope: 'openid email customer-account-api:full',
        redirect_uri: 'https://ign-shopify-commerce.vercel.app/api/auth/callback',
        response_type: 'code',
        state,
        nonce,
    });

    const url = `https://shopify.com/authentication/75087675606/oauth/authorize?${queryParams.toString()}`;

    return NextResponse.redirect(url);
}
