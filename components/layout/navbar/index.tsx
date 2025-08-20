import { LogoutButton } from 'components/account/LogoutButton';
import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import { getMenu } from 'lib/shopify';
import { Menu } from 'lib/shopify/types';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import MobileMenu from './mobile-menu';
import Search from './search';

const { SITE_NAME } = process.env;

export async function Navbar() {
  const menu = await getMenu('next-js-frontend-header-menu');

  const cookieStore = cookies();
  const idToken = (await cookieStore).get('shopify_id_token')?.value;

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">

      {/* --- First Row: Logo + Search + Login/Register + Cart --- */}
      <div className="flex flex-col bg-primary md:flex-row items-center justify-between px-4 py-3 lg:px-8 gap-y-3 md:gap-y-0">

        {/* Left: Logo */}
        <div className="flex md:flex-1 justify-start">
          <Link href="/" prefetch className="flex items-center space-x-2">
            <LogoSquare />
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex justify-center w-full">
          <div className="w-full md:w-1/2">
            <Suspense>
              <Search />
            </Suspense>
          </div>
        </div>

        {/* Right: Account Dropdown or Register/Login + Cart */}
        <div className="flex md:flex-1 justify-end items-center space-x-6">
          {idToken === undefined ? (
            <Link
              href="/login"
              className="text-sm font-semibold text-white hover:text-secondary underline-offset-4 hover:underline transition-colors duration-200 whitespace-nowrap"
            >
              Register/Login
            </Link>
          ) : (
            <div className="relative group inline-block text-left">
              <button
                type="button"
                className="flex items-center space-x-2 focus:outline-none"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A4 4 0 017 16h10a4 4 0 011.879 1.804M12 12a5 5 0 100-10 5 5 0 000 10z"
                  />
                </svg>

                <span className="hidden md:inline-block text-sm font-semibold text-white">
                  Account
                </span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Advanced Dropdown */}
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg shadow-xl bg-white dark:bg-neutral-900 ring-1 ring-black ring-opacity-5 z-50 opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-200">
                <div className="p-4 space-y-2">

                  {/* Company Profile */}
                  <Link href="/account" className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-neutral-800 p-2 rounded-md transition-colors">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M5.121 17.804A4 4 0 017 16h10a4 4 0 011.879 1.804M12 12a5 5 0 100-10 5 5 0 000 10z" />
                    </svg>
                    <span className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">Company Profile</span>
                  </Link>

                  <hr className="border-t border-neutral-200 dark:border-neutral-700" />

                  {/* Logout */}
                  <div className="flex items-center space-x-3 hover:bg-red-100 dark:hover:bg-red-700 p-2 rounded-md cursor-pointer transition-colors">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                    </svg>
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          )}
          <CartModal />
        </div>
      </div>

      {/* --- Second Row: Nav Menu --- */}
      <div className="flex bg-secondary items-center justify-center px-4 pt-3 pb-3 lg:px-8">
        {/* Desktop Nav Menu */}
        {menu.length > 0 && (
          <ul className="hidden md:flex items-center space-x-6 text-sm">
            {menu
              .filter(item => item.title !== 'Profile')
              .map((item: Menu) => (
                <li key={item.title} className="whitespace-nowrap">
                  <Link href={item.path} prefetch className="text-dark hover:text-cyan font-semibold underline-offset-4 hover:underline transition-colors duration-200">
                    {item.title}
                  </Link>
                </li>
              ))}
            <li className="whitespace-nowrap">
              <Link href="/account/profile" prefetch className="text-dark hover:text-cyan font-semibold underline-offset-4 hover:underline transition-colors duration-200">
                Draft order
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
