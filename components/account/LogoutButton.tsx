// app/components/LogoutButton.tsx
'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {

        const SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_SHOPID!;
        const SHOP_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
        const APP_URL = process.env.NEXT_PUBLIC_SITE_URL!;  // e.g. your ngrok or Vercel URL

        const idToken = Cookies.get('shopify_id_token');
        let targetUrl: string;
        if (idToken) {
            const logoutUrl = new URL(
                `https://shopify.com/authentication/${SHOP_ID}/logout`
            );
            logoutUrl.searchParams.set('id_token_hint', idToken);
            logoutUrl.searchParams.set(
                'post_logout_redirect_uri',
                `https://${SHOP_DOMAIN}/account/logout?return_to=${encodeURIComponent(
                    APP_URL
                )}`
            );
            targetUrl = logoutUrl.toString();
        } else {
            targetUrl = APP_URL;
        }

        Cookies.remove('shopify_id_token');
        Cookies.remove('companyLocationId');    //Remove if code breaks on logout

        // This does a full browser navigation to the external URL
        router.push(targetUrl);
    };

    return (
        <button
            onClick={handleLogout}
            className="text-sm font-semibold text-neutral-600 hover:text-blue-600 transition bg-transparent cursor-pointer"
        >
            Logout
        </button>
    );
}
