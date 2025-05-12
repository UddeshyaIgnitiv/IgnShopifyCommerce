import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import { getMenu } from 'lib/shopify';
import { Menu } from 'lib/shopify/types';
import Link from 'next/link';
import { Suspense } from 'react';
import MobileMenu from './mobile-menu';
import Search, { SearchSkeleton } from './search';

const { SITE_NAME } = process.env;

export async function Navbar() {
  const menu = await getMenu('next-js-frontend-header-menu');

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
      <div className="flex items-center justify-between px-4 py-3 lg:px-8">
        {/* Left: Mobile menu or Logo + nav links */}
        <div className="flex items-center space-x-4 md:flex-1">
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Suspense fallback={null}>
              <MobileMenu menu={menu} />
            </Suspense>
          </div>

          {/* Logo */}
          <Link href="/" prefetch className="flex items-center space-x-2">
            <LogoSquare />
            <span className="text-sm font-semibold uppercase whitespace-nowrap md:hidden lg:block">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          {menu.length > 0 && (
            <ul className="hidden md:flex items-center space-x-6 text-sm ml-6">
              {menu.map((item: Menu) => (
                <li key={item.title} className="whitespace-nowrap">
                  <Link
                    href={item.path}
                    prefetch
                    className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Center: Search with left padding */}
        <div className="hidden md:flex md:flex-1 justify-center pl-4">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>

        <ul className="hidden md:flex items-center space-x-6 text-sm ml-6">
          <li className="whitespace-nowrap"><Link href="/register-company" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white underline-offset-4 hover:underline">Register</Link></li>
          <li className="whitespace-nowrap"><Link href="/login" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white underline-offset-4 hover:underline">Login</Link></li>
        </ul>

        {/* Right: Cart */}
        <div className="flex justify-end md:flex-1">
          <CartModal />
        </div>
      </div>
    </nav>
  );
}
