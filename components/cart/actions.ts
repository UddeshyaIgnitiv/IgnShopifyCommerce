'use server';

import { TAGS } from 'lib/constants';
import {
  addToCart,
  cartBuyerIdentityUpdate,
  createCart,
  getCart,
  removeFromCart,
  updateCart
} from 'lib/shopify';
import { CartBuyerIdentityInput } from 'lib/shopify/types';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  if (!selectedVariantId) {
    return 'Error adding item to cart';
  }

  try {
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    revalidateTag(TAGS.cart);
  } catch (e) {
    return 'Error adding item to cart';
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return 'Error fetching cart';
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      revalidateTag(TAGS.cart);
    } else {
      return 'Item not found in cart';
    }
  } catch (e) {
    return 'Error removing item from cart';
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return 'Error fetching cart';
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity
          }
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }]);
    }

    revalidateTag(TAGS.cart);
  } catch (e) {
    console.error(e);
    return 'Error updating item quantity';
  }
}

// export async function redirectToCheckout() {
//   let cart = await getCart();
//   redirect(cart!.checkoutUrl);
// }

export async function redirectToCheckout() {

  const cookieStore = cookies();

  // 1. load current cart
  const cart = await getCart();
  if (!cart) {
    throw new Error('No active cart found');
  }

  // 1.a. ensure we actually have a cart ID
  if (!cart.id) {
    throw new Error('Cart is missing its ID — cannot update buyerIdentity');
  }

  // 2. pull buyerIdentity values from cookies
  const customerAccessToken = (await cookieStore).get('shopify_access_token')?.value;
  const companyLocationId = (await cookieStore).get('companyLocationId')?.value;
  const customerEmailRaw = (await cookieStore).get('user_email')?.value;
  const customerEmail = customerEmailRaw ? decodeURIComponent(customerEmailRaw) : null;

  // 3. only call the mutation if you actually have something to set
  let updatedCart = cart;
  if (customerAccessToken || companyLocationId) {
    const buyerIdentity: CartBuyerIdentityInput = {};
    if (customerAccessToken) buyerIdentity.customerAccessToken = customerAccessToken;
    if (companyLocationId) buyerIdentity.companyLocationId = companyLocationId;
    if (customerEmail) buyerIdentity.email = customerEmail;

    updatedCart = await cartBuyerIdentityUpdate({
      cartId: cart.id,
      buyerIdentity,
    });
  }

  // 4. redirect
  redirect(updatedCart.checkoutUrl);
}


// export async function createCartAndSetCookie() {
//   let cart = await createCart();
//   (await cookies()).set('cartId', cart.id!);
// }

// Helper: Fetch customer by email

export async function createCartAndSetCookie() {
  const cookieStore = cookies();
  const customerAccessToken = (await cookieStore).get('shopify_access_token')?.value;
  const companyLocationId = (await cookieStore).get('companyLocationId')?.value;

  const cart = await createCart({
    customerAccessToken,
    companyLocationId
  });

  (await cookieStore).set('cartId', cart.id!);
  console.log("New Cart set, companyLocationId ---> ", companyLocationId);
}

