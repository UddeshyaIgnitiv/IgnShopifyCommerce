import { getMenu } from 'lib/shopify';
import { cookies } from 'next/headers';
import NavbarClient from './navbar-client';

const { SITE_NAME } = process.env;

export async function Navbar() {
  const menu = await getMenu('next-js-frontend-header-menu');
  const cookieStore = cookies();
  const idToken = (await cookieStore).get('shopify_id_token')?.value;

  return (
    <NavbarClient menu={menu} idToken={idToken} />
  );
}
