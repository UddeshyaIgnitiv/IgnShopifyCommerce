import { getCustomerByEmail } from 'lib/shopify';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const emailRaw = (await cookies()).get('user_email')?.value;
    const email = emailRaw ? decodeURIComponent(emailRaw) : null;

    if (!email) {
        return NextResponse.json({ error: 'Email cookie missing' }, { status: 401 });
    }

    try {
        const customer = await getCustomerByEmail(email);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const firstLocationId = customer.companyContactProfiles?.[0]?.company?.locations?.edges?.[0]?.node?.id;

        const res = NextResponse.json(customer);

        // Set companyLocationId cookie if found
        if (firstLocationId) {
            res.cookies.set({
                name: 'companyLocationId',
                value: firstLocationId,
                httpOnly: true,
                secure: true,
                path: '/',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
            });
        }

        return res;
    } catch (err) {
        console.error('Error getting customer:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
