import { jwtDecode } from 'jwt-decode';
import { NextRequest, NextResponse } from 'next/server';

interface IdTokenPayload {
    email?: string;
    [key: string]: any;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const client_id = process.env.CLIENT_ID!;
    const client_secret = process.env.CLIENT_SECRET!;
    const redirect_uri = 'https://ign-shopify-commerce.vercel.app/account';

    const tokenEndpoint = `https://shopify.com/authentication/${process.env.SHOPIFY_SHOPID}/oauth/token`;

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id,
        client_secret,
    });

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Token exchange failed:', data);
            return NextResponse.json({ error: 'Token exchange failed', details: data }, { status: 500 });
        }

        //console.log('Access Token:', data);

        const accessToken = data.access_token;
        const idToken = data.id_token;

        let email = '';
        if (idToken) {
            try {
                const decoded = jwtDecode<IdTokenPayload>(idToken);
                email = decoded.email || '';
                //console.log('Decoded Email:', email);
            } catch (decodeErr) {
                console.error('Failed to decode id_token:', decodeErr);
            }
        }

        const res = NextResponse.redirect('https://ign-shopify-commerce.vercel.app/account');

        res.cookies.set({
            name: 'shopify_access_token',
            value: accessToken,
            // httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'lax',
            maxAge: data.expires_in,
        });

        if (email) {
            res.cookies.set({
                name: 'user_email',
                value: email,
                httpOnly: true,
                secure: true,
                path: '/',
                sameSite: 'lax',
                maxAge: data.expires_in,
            });
        }

        return res;
    } catch (error) {
        console.error('Error fetching token:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
