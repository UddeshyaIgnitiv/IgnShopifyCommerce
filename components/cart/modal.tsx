'use client';

import { Dialog, Transition } from '@headlessui/react';
import { ShoppingCartIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import LoadingDots from 'components/loading-dots';
import Price from 'components/price';
import Cookies from 'js-cookie';
import { DEFAULT_OPTION } from 'lib/constants';
import { createUrl } from 'lib/utils';
import { useUserRole } from 'lib/utils/useUserRole';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createCartAndSetCookie, redirectToCheckout, requestQuote } from './actions';
import { useCart } from './cart-context';
import { DeleteItemButton } from './delete-item-button';
import { EditItemQuantityButton } from './edit-item-quantity-button';
import OpenCart from './open-cart';

type MerchandiseSearchParams = {
  [key: string]: string;
};

const PopupMessage = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <>
    {/* Overlay */}
    <div className="fixed inset-0 bg-black/50 z-[9998]" aria-hidden="true"></div>

    {/* Popup Message */}
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white p-6 rounded-md w-80 text-center shadow-lg">
      <p className="text-sm text-red-700">{message}</p>
      <button
        onClick={onClose} // Close the popup when clicked
        className="mt-4 bg-red-500 text-white rounded-full px-4 py-2"
      >
        Close
      </button>
    </div>
  </>
);

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [quoteNote, setQuoteNote] = useState('');

  const quantityRef = useRef(cart?.totalQuantity);

  const openCart = () => setIsOpen(true);

  const closeCart = () => {
    setIsOpen(false);
    setMessage(null); // clear message when closing cart
  };;

  const idToken = Cookies.get('shopify_id_token')?.valueOf;

  if (!idToken) return (
    <>
      <button aria-label="Open cart" onClick={openCart} className="bg-transparent">
        <OpenCart quantity={cart?.totalQuantity} />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/80 p-6 text-black backdrop-blur-xl md:w-[390px] dark:border-neutral-700 dark:bg-black/80 dark:text-white">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">My Cart</p>
                <button aria-label="Close cart" onClick={closeCart}>
                  <CloseCart />
                </button>
              </div>
              <div className="mt-20 flex w-full flex-col items-center justify-center overflow-hidden">
                <ShoppingCartIcon className="h-16" />
                <p className="mt-6 text-center text-2xl font-bold">
                  Your cart is empty.
                </p>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );

  const { role, loading: roleLoading } = useUserRole();
  const isNonPurchaser = role === 'non_purchaser';

  //console.log('Current user role:', role);
  //console.log('Is user non_purchaser?', isNonPurchaser);


  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  useEffect(() => {
    if (
      cart?.totalQuantity &&
      cart?.totalQuantity !== quantityRef.current &&
      cart?.totalQuantity > 0
    ) {
      if (!isOpen) {
        setIsOpen(true);
      }
      quantityRef.current = cart?.totalQuantity;
    }
  }, [isOpen, cart?.totalQuantity, quantityRef]);

  // Handle checkout with error message handling
  const handleCheckout = async () => {
    setMessage(null);

    try {
      await redirectToCheckout();
    } catch (err: any) {
      let errorText = 'An unexpected error occurred during checkout. Please try again later.';

      if (err.message.includes('Company location not found or not allowed')) {
        errorText = `${err.message}. Please verify your location and try again.`;
      } else {
        errorText = err.message || errorText;
      }

      setPopupMessage(errorText);
      setShowPopup(true);
      console.error('Checkout error:', err);
    }
  };

  return (
    <>
      <button aria-label="Open cart" onClick={openCart} className="bg-transparent">
        <OpenCart quantity={cart?.totalQuantity} />
      </button>
      {/* Custom Popup Message */}
      {showPopup && (
        <PopupMessage
          message={popupMessage}
          onClose={() => setShowPopup(false)} // Close the popup when clicked
        />
      )}
      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/80 p-6 text-black backdrop-blur-xl md:w-[390px] dark:border-neutral-700 dark:bg-black/80 dark:text-white">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">My Cart</p>
                <button className='bg-transparent' aria-label="Close cart" onClick={closeCart}>
                  <CloseCart />
                </button>
              </div>

              {!cart || cart.lines.length === 0 ? (
                <div className="mt-20 flex w-full flex-col items-center justify-center overflow-hidden">
                  {message && message.type === 'success' ? (
                    <p className="text-center text-green-700 bg-green-100 rounded-md px-4 py-2 text-sm">
                      {message.text}
                    </p>
                  ) : (
                    <>
                      <ShoppingCartIcon className="h-16" />
                      <p className="mt-6 text-center text-2xl font-bold">
                        Your cart is empty.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between overflow-hidden p-1">
                  <ul className="grow overflow-auto py-4">
                    {cart.lines
                      .sort((a, b) =>
                        a.merchandise.product.title.localeCompare(
                          b.merchandise.product.title
                        )
                      )
                      .map((item, i) => {
                        const merchandiseSearchParams =
                          {} as MerchandiseSearchParams;

                        item.merchandise.selectedOptions.forEach(
                          ({ name, value }) => {
                            if (value !== DEFAULT_OPTION) {
                              merchandiseSearchParams[name.toLowerCase()] =
                                value;
                            }
                          }
                        );

                        const merchandiseUrl = createUrl(
                          `/product/${item.merchandise.product.handle}`,
                          new URLSearchParams(merchandiseSearchParams)
                        );

                        return (
                          <li
                            key={i}
                            className="flex w-full flex-col border-b border-neutral-300 dark:border-neutral-700"
                          >
                            <div className="relative flex w-full flex-row justify-between px-1 py-4">
                              <div className="absolute z-40 -ml-1 -mt-2">
                                <DeleteItemButton
                                  item={item}
                                  optimisticUpdate={updateCartItem}
                                />
                              </div>
                              <div className="flex flex-row">
                                <div className="relative h-16 w-16 overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                                  <Image
                                    className="h-full w-full object-cover"
                                    width={64}
                                    height={64}
                                    alt={
                                      item.merchandise.product.featuredImage
                                        .altText ||
                                      item.merchandise.product.title
                                    }
                                    src={
                                      item.merchandise.product.featuredImage.url
                                    }
                                  />
                                </div>
                                <Link
                                  href={merchandiseUrl}
                                  onClick={closeCart}
                                  className="z-30 ml-2 flex flex-row space-x-4"
                                >
                                  <div className="flex flex-1 flex-col text-base">
                                    <span className="leading-tight">
                                      {item.merchandise.product.title}
                                    </span>
                                    {item.merchandise.title !==
                                      DEFAULT_OPTION ? (
                                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {item.merchandise.title}
                                      </p>
                                    ) : null}
                                  </div>
                                </Link>
                              </div>
                              <div className="flex h-16 flex-col justify-between">
                                <Price
                                  className="flex justify-end space-y-2 text-right text-sm"
                                  amount={item.cost.totalAmount.amount}
                                  currencyCode={
                                    item.cost.totalAmount.currencyCode
                                  }
                                />
                                <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                                  <EditItemQuantityButton
                                    item={item}
                                    type="minus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                  <p className="w-6 text-center">
                                    <span className="w-full text-sm">
                                      {item.quantity}
                                    </span>
                                  </p>
                                  <EditItemQuantityButton
                                    item={item}
                                    type="plus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                  <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 dark:border-neutral-700">
                      <p>Taxes</p>
                      <Price
                        className="text-right text-base text-black dark:text-white"
                        amount={cart.cost.totalTaxAmount.amount}
                        currencyCode={cart.cost.totalTaxAmount.currencyCode}
                      />
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      <p>Shipping</p>
                      <p className="text-right">Calculated at checkout</p>
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      <p>Total</p>
                      <Price
                        className="text-right text-base text-black dark:text-white"
                        amount={cart.cost.totalAmount.amount}
                        currencyCode={cart.cost.totalAmount.currencyCode}
                      />
                    </div>
                  </div>
                  <form action={handleCheckout}>
                    <CheckoutButton disabled={roleLoading || isNonPurchaser} />
                  </form>
                  <div className="quoteNote mt-4 space-y-4">
                    {/* Message Box */}
                    {message && (
                      <div
                        className={clsx(
                          'relative flex items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-sm border',
                          message.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        )}
                        role="alert"
                      >
                        {/* Text */}
                        <span className="flex-1">{message.text}</span>

                        {/* Dismiss button */}
                        <button
                          onClick={() => setMessage(null)}
                          className="ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                          aria-label="Close message"
                          type="button"
                        >
                          <XMarkIcon className="h-5 w-5 text-current" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                    {/* Textarea */}
                    <div>
                      <label
                        htmlFor="quote-note"
                        className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                      >
                        Add a note to your quote:
                      </label>
                      <textarea
                        id="quote-note"
                        name="note"
                        rows={2}
                        value={quoteNote}
                        onChange={(e) => setQuoteNote(e.target.value)}
                        className="mt-2 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all duration-150"
                        placeholder="E.g., Add extra details here..."
                      />
                    </div>

                    {/* Quote Request Button */}
                    <RequestQuoteButton
                      disabled={roleLoading || isNonPurchaser}
                      setMessage={setMessage}
                      note={quoteNote}
                      setQuoteNote={setQuoteNote}
                    />
                  </div>

                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

function CloseCart({ className }: { className?: string }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white">
      <XMarkIcon
        className={clsx(
          'h-6 transition-all ease-in-out hover:scale-110',
          className
        )}
      />
    </div>
  );
}

function CheckoutButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={clsx(
        'block w-full rounded-full p-3 text-center text-sm font-medium',
        disabled || pending
          ? 'bg-teal text-white opacity-50 cursor-not-allowed pointer-events-none'
          : 'bg-teal text-white opacity-90 cursor-pointer hover:bg-cyan'
      )}
      type={disabled ? 'button' : 'submit'}
      disabled={pending || disabled}
      title={disabled ? 'You are not allowed to purchase' : undefined}
    >
      {pending ? <LoadingDots className="bg-white" /> : 'Proceed to Checkout'}
    </button>
  );
}

function RequestQuoteButton({ disabled, setMessage, note, setQuoteNote }: { disabled?: boolean, setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void; note: string; setQuoteNote: React.Dispatch<React.SetStateAction<string>>;}) {
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);
    try {
      const formData = new FormData();
      const defaultNote = "Requested quote from storefront";
      const noteToSend = note.trim() || defaultNote;
      formData.append('note', noteToSend);

      await requestQuote(formData);
      
      setMessage({ type: 'success', text: 'Your quote request has been submitted' });
      setQuoteNote('');
      setTimeout(() => setMessage(null), 20000);
    } catch (err: any) {
      const errorText = err?.message || 'Something went wrong while creating quote';
      setMessage({ type: 'error', text: errorText });
      console.log("Quote error", err);
      setTimeout(() => setMessage(null), 20000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleAction}
      className={clsx(
        'mt-2 block w-full rounded-full p-3 text-center text-sm font-medium transition-all duration-200 ease-in-out',
        loading || disabled
          ? 'bg-gray-600 text-white opacity-50 cursor-not-allowed pointer-events-none'
          : 'bg-gray-600 text-white opacity-90 hover:opacity-100 cursor-pointer'
      )}
      type="button"
      disabled={loading || disabled}
    >
      {loading ? <LoadingDots className="bg-white" /> : 'Request Quote'}
    </button>
  );
}


