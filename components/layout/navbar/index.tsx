import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import { getMenu } from 'lib/shopify';
import { Menu } from 'lib/shopify/types';
import Link from 'next/link';
import { Suspense } from 'react';
import MobileMenu from './mobile-menu';
import Search from './search';

const { SITE_NAME } = process.env;

export async function Navbar() {
  const menu = await getMenu('next-js-frontend-header-menu');

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">

      {/* --- First Row: Logo + Search + Login/Register + Cart --- */}
      <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 lg:px-8 gap-y-3 md:gap-y-0">

        {/* Left: Logo */}
        <div className="flex md:flex-1 justify-start">
          <Link href="/" prefetch className="flex items-center space-x-2">
            <LogoSquare />
          </Link>
        </div>

        {/* Center: Search with rounded border */}
        <div className="flex justify-center w-full">
        <div className="w-full md:w-1/2">
            <Suspense>
              <Search />
            </Suspense>
        </div>
        </div>

        {/* Right: Register/Login + Cart */}
        <div className="flex md:flex-1 justify-end items-center space-x-6">
          <Link
            href="/register-company"
            className="text-sm font-semibold text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 underline-offset-4 hover:underline transition-colors duration-200"
          >
            Register
          </Link>

          {menu.length > 0 && (
            <ul className="hidden md:flex items-center space-x-6 text-sm">
              {menu.filter(item => item.title === 'Profile').map((item: Menu) => (
                <li key={item.title} className="whitespace-nowrap">
                  <Link
                    href={item.path}  // Dynamic path from the menu array
                    prefetch
                    className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 font-semibold underline-offset-4 hover:underline transition-colors duration-200"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/api/auth/login"
            className="text-sm font-semibold text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 underline-offset-4 hover:underline transition-colors duration-200"
          >
            Login
          </Link>
          <CartModal />
        </div>
      </div>

      {/* --- Second Row: Nav Menu --- */}
      <div className="flex items-center justify-center px-4 pb-3 lg:px-8">
        {/* Desktop Nav Menu */}
        {menu.length > 0 && (
        <ul className="hidden md:flex items-center space-x-6 text-sm">
          {menu
            .filter(item => item.title !== 'Profile')
            .map((item: Menu) => (
              <li key={item.title} className="whitespace-nowrap">
                <Link href={item.path} prefetch className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 font-semibold underline-offset-4 hover:underline transition-colors duration-200">
                  {item.title}
                </Link>
              </li>
            ))}
          <li className="whitespace-nowrap">
            <Link href="/account/profile" prefetch className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 font-semibold underline-offset-4 hover:underline transition-colors duration-200">
              Profile
            </Link>
          </li>
        </ul>
        )}


        {/* Mobile Menu */}
        <div className="md:hidden w-full">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
