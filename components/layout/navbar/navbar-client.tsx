'use client';

import LocationSelector from 'components/account/locationSelector';
import LogoutButton from 'components/account/LogoutButton';
import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import QuickOrderModal from 'components/quick-order/QuickOrderModal';
import SideSliderMenu from 'components/sideSliderMenu';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import MobileMenu from './mobile-menu';
import Search from './search';

interface NavbarClientProps {
    menu: any[];
    idToken?: string;
}

export default function NavbarClient({ menu, idToken }: NavbarClientProps) {
    const [isQuickOrderOpen, setQuickOrderOpen] = useState(false);

    return (
        <nav className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">

            {/* First Row */}
            <div className="flex flex-col bg-primary md:flex-row items-center justify-between px-4 py-3 lg:px-8 gap-y-3 md:gap-y-0">
                {/* Logo */}
                <div className="flex md:flex-1 justify-start">
                    <Link href="/" prefetch className="flex items-center space-x-2">
                        <LogoSquare />
                    </Link>
                </div>

                {/* Search */}
                <div className="flex justify-center w-full">
                    <div className="w-full md:w-1/2">
                        <Suspense>
                            <Search />
                        </Suspense>
                    </div>
                </div>

                {/* Account + Cart */}
                <div className="flex md:flex-1 justify-end items-center space-x-6">
                    {idToken === undefined ? (
                        <Link
                            href="/login"
                            className="text-base font-semibold text-white hover:text-secondary underline-offset-4 hover:underline transition-colors duration-200 whitespace-nowrap"
                        >
                            Register/Login
                        </Link>
                    ) : (
                        <div className="relative group inline-block text-left">
                            <button
                                type="button"
                                className="flex items-center space-x-2 focus:outline-none bg-transparent"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                {/* User Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 017 16h10a4 4 0 011.879 1.804M12 12a5 5 0 100-10 5 5 0 000 10z" />
                                </svg>
                                <span className="hidden md:inline-block text-sm md:text-base font-semibold text-white">
                                    Account
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-lg shadow-xl bg-white dark:bg-neutral-900 ring-1 ring-black ring-opacity-5 z-50 opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-200">
                                <div className="p-4 space-y-2">
                                    <Link href="/account" className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-neutral-800 p-2 rounded-md transition-colors">
                                        <span className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">Customer Profile</span>
                                    </Link>
                                    <hr className="border-t border-neutral-200 dark:border-neutral-700" />
                                    <LocationSelector />
                                    <hr className="border-t border-neutral-200 dark:border-neutral-700" />
                                    <div className="flex items-center space-x-3 hover:bg-red-100 dark:hover:bg-red-700 p-2 rounded-md cursor-pointer transition-colors">
                                        <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                                            <LogoutButton className="text-sm font-semibold text-neutral-600 hover:text-blue-600 transition bg-transparent cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <CartModal />
                </div>
            </div>

            {/* Second Row */}
            <div className="flex bg-secondary items-center justify-flex-start px-4 pt-3 pb-3 lg:px-8">
                {menu.length > 0 && (
                    <>
                        <div className="hidden md:block">
                            <SideSliderMenu menu={menu} />
                        </div>
                        <ul className="hidden md:flex items-center space-x-6 text-sm ml-12">
                            <li><Link href="/account" className="text-base text-dark hover:text-cyan font-semibold underline-offset-4 hover:underline">Profile</Link></li>
                            <li><Link href="/" className="text-base text-dark hover:text-cyan font-semibold underline-offset-4 hover:underline">About Us</Link></li>
                            <li><Link href="/" className="text-base text-dark hover:text-cyan font-semibold underline-offset-4 hover:underline">Contact Us</Link></li>
                            {idToken && (
                                <li>
                                    <button
                                        onClick={() => setQuickOrderOpen(true)}
                                        className="text-base bg-transparent hover:bg-transparent text-dark hover:text-cyan font-semibold underline-offset-4 hover:underline"
                                    >
                                        Quick Order
                                    </button>

                                </li>
                            )}
                        </ul>
                    </>
                )}

                {/* Mobile */}
                <div className="md:hidden w-full">
                    <Suspense fallback={null}>
                        <MobileMenu menu={menu} />
                    </Suspense>
                </div>
            </div>

            {isQuickOrderOpen && (
                <QuickOrderModal onClose={() => setQuickOrderOpen(false)} />
            )}
        </nav>
    );
}
