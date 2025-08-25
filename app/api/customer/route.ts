import { getCustomerByEmail } from 'lib/shopify';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const emailRaw = cookieStore.get('user_email')?.value;
    const companyLocationId = cookieStore.get('companyLocationId')?.value;
    const email = emailRaw ? decodeURIComponent(emailRaw) : null;

    if (!email) {
        return NextResponse.json({ error: 'Email cookie missing' }, { status: 401 });
    }

    try {
        const customer = await getCustomerByEmail(email);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const companyId = customer?.companyContactProfiles?.[0]?.company?.id || null;

        const metafields = customer?.metafields?.edges || [];
        const adminField = metafields.find((m: any) => m.node.key === 'is_customer_admin');
        const isAdmin = String(adminField?.node?.value || '').trim().toLowerCase() === 'true';

        // 🔹 Set cookies here
        cookieStore.set('is_customer_admin', isAdmin ? 'true' : 'false');
        if (companyId) {
        cookieStore.set('company_id', companyId, { path: '/' });
        }

        // ✅ Flatten metafields if they exist as edges → node
        if (customer?.metafields?.edges) {
        customer.metafields = customer.metafields.edges.map((edge: any) => edge.node);
        }

        const firstLocationId = customer.companyContactProfiles?.[0]?.company?.locations?.edges?.[0]?.node?.id;

        const res = NextResponse.json(customer);

        // Set companyLocationId if not already set
        if (firstLocationId && !companyLocationId) {
            res.cookies.set('companyLocationId', firstLocationId, {
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
