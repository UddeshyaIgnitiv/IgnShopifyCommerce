'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Fragment, useState } from 'react'

interface Menu {
    title: string
    path: string
}

interface SideSliderMenuProps {
    menu: Menu[]
}

export default function SideSliderMenu({ menu }: SideSliderMenuProps) {
    const [isOpen, setIsOpen] = useState(false)

    const closeMenu = () => setIsOpen(false)
    const openMenu = () => setIsOpen(true)

    return (
        <>
            {/* Toggle Button */}
            <div className="flex flex-col items-center space-y-1">
                <button
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md bg-primary text-white hover:text-cyan hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan transition-colors duration-300 cursor-pointer"
                    onClick={openMenu}
                    aria-label="Open navigation menu"
                >
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
                {/* <span className="text-sm font-medium text-white">Shop All</span> */}
            </div>

            {/* Side Slider Menu */}
            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeMenu}>
                    {/* Backdrop */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-in-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in-out duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-transparent backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
                                <Transition.Child
                                    as={Fragment}
                                    enter="transform transition ease-in-out duration-300"
                                    enterFrom="-translate-x-full"
                                    enterTo="translate-x-0"
                                    leave="transform transition ease-in-out duration-300"
                                    leaveFrom="translate-x-0"
                                    leaveTo="-translate-x-full"
                                >
                                    <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md flex flex-col bg-white shadow-xl">

                                        {/* Header */}
                                        <div className="px-4 sm:px-6 pt-6 pb-6 bg-primary text-white shadow-md">
                                            <Dialog.Title className="text-lg font-semibold text-center">
                                                Navigation
                                            </Dialog.Title>
                                        </div>

                                        {/* Scrollable Menu Content */}
                                        <div className="flex-1 overflow-y-auto">
                                            <nav className="flex flex-col mt-6">
                                                {menu
                                                    .filter(item => item.title !== 'Profile')
                                                    .map((item: Menu) => (
                                                        <Link
                                                            key={item.title}
                                                            href={item.path}
                                                            prefetch
                                                            className="text-base text-dark hover:text-cyan font-semibold py-5 px-6 sm:px-6 hover:bg-gray-100 transition-all duration-200"
                                                            onClick={closeMenu}
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    ))}
                                                {/* <Link
                                                    href="/account/profile"
                                                    prefetch
                                                    className="text-base text-dark hover:text-cyan font-semibold py-3 px-2 rounded-md hover:bg-gray-50 transition-all duration-200 border-b border-gray-100"
                                                    onClick={closeMenu}
                                                >
                                                    Draft order
                                                </Link> */}
                                            </nav>
                                        </div>

                                        {/* Sticky Close Button */}
                                        <div className="p-4 border-t border-gray-200 flex justify-center">
                                            <button
                                                type="button"
                                                className="grid place-items-center h-10 w-10 rounded-full bg-primary text-white 
                                                            hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan p-0 
                                                            transition-colors duration-300 cursor-pointer"
                                                onClick={closeMenu}
                                            >
                                                <XMarkIcon className="h-6 w-6 stroke-[2.5] text-white hover:text-secondary transition-colors duration-300" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    )
}
