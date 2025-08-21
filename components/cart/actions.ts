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
import CREATE_DRAFT_ORDER from 'lib/shopify/mutations/orders/createDraftOrder';
import { CartBuyerIdentityInput } from 'lib/shopify/types';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ✅ shared Admin API helper
import { adminGraphql } from 'lib/shopifyAdmin';

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

export async function redirectToCheckout() {
  const cookieStore = cookies();

  // 1. load current cart
  const cart = await getCart();
  if (!cart) {
    throw new Error('No active cart found');
  }

  if (!cart.id) {
    throw new Error('Cart is missing its ID — cannot update buyerIdentity');
  }

  // 2. pull buyerIdentity values from cookies
  const customerAccessToken = (await cookieStore).get('shopify_access_token')?.value;
  const companyLocationId = (await cookieStore).get('companyLocationId')?.value;
  const customerEmailRaw = (await cookieStore).get('user_email')?.value;
  const customerEmail = customerEmailRaw ? decodeURIComponent(customerEmailRaw) : null;

  // 3. only call mutation if needed
  let updatedCart = cart;
  if (customerAccessToken || companyLocationId || customerEmail) {
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

export async function createCartAndSetCookie() {
  const cookieStore = cookies();
  const customerAccessToken = (await cookieStore).get('shopify_access_token')?.value;
  const companyLocationId = (await cookieStore).get('companyLocationId')?.value;

  const cart = await createCart({
    customerAccessToken,
    companyLocationId
  });

  (await cookieStore).set('cartId', cart.id!);
  //console.log("🛒 New Cart set, companyLocationId ---> ", companyLocationId);
}

export async function requestQuote(_formData: FormData): Promise<void> {
  console.log('🚀 requestQuote started...');

  const cart = await getCart();
  //console.log('Cart fetched:', cart?.id);

  if (!cart) throw new Error('No active cart found');
  if (!cart.lines.length) throw new Error('Your cart is empty.');
  if (!cart?.id) {
    throw new Error('Cart is missing its ID — cannot update buyerIdentity');
  }

  // 🧠 Fetch identity from cookies
  const cookieStore = cookies();
  const customerAccessToken = (await cookieStore).get('shopify_access_token')?.value;
  const companyLocationId = (await cookieStore).get('companyLocationId')?.value;
  const customerEmailRaw = (await cookieStore).get('user_email')?.value;
  const customerEmail = customerEmailRaw ? decodeURIComponent(customerEmailRaw) : null;

  if (!customerAccessToken && !customerEmail) {
    throw new Error('You must be logged in or provide an email to request a quote.');
  }

   // 🛠 Update cart with buyer identity if available
  let updatedCart = cart;
  if (customerAccessToken || companyLocationId || customerEmail) {
    const buyerIdentity: CartBuyerIdentityInput = {};
    if (customerAccessToken) {
  buyerIdentity.customerAccessToken = customerAccessToken;

  if (companyLocationId) {
    buyerIdentity.companyLocationId = companyLocationId;
  }
}

if (customerEmail) {
  buyerIdentity.email = customerEmail;
}

    updatedCart = await cartBuyerIdentityUpdate({
      cartId: cart.id,
      buyerIdentity,
    });

    console.log('🔄 Cart buyer identity updated.');
  }

  // ✅ Filter out invalid line items
  const lineItems = cart.lines
    .filter((line) => line.merchandise?.id)
    .map((line) => ({
      variantId: line.merchandise.id as string,
      quantity: line.quantity,
    }));

  //console.log('Line items prepared for draft order:', lineItems);

  const customerId = updatedCart?.buyerIdentity?.customer?.id;

  const draftOrderInput: any = {
  lineItems,
  note: 'Requested quote from storefront',
  tags: ['request_quote'],
};

if (customerId) {
  draftOrderInput.customerId = customerId;
  //console.log('✅ Using customerId:', customerId);
} else if (customerEmail) {
  draftOrderInput.email = customerEmail;
  //console.log('✅ Using fallback customer email:', customerEmail);
} else {
  console.warn('⚠️ No customerId or email available for draft order');
}
  
  if (!customerId) {
  console.warn('⚠️ No customer ID found on updated cart. Was the user logged in?');
}

//console.log('✅ Customer ID attached to draft order:', customerId || 'none');

  // ✅ Create draft order
  const data = await adminGraphql(CREATE_DRAFT_ORDER, {
    input: draftOrderInput,
  });

  //console.log('Draft order response:', JSON.stringify(data, null, 2));

  if (data.errors?.length) {
    console.error('❌ Draft order creation error:', data.errors);
    throw new Error(data.errors[0].message || 'Failed to create draft order');
  }

  if (data.data?.draftOrderCreate?.userErrors?.length) {
    console.error('⚠️ Draft order user errors:', data.data.draftOrderCreate.userErrors);
    throw new Error(
      data.data.draftOrderCreate.userErrors[0].message || 'Failed to create draft order'
    );
  }

  //console.log('✅ Draft order created:', data?.data?.draftOrderCreate?.draftOrder?.id);

  // ✅ Empty the cart after successful draft order
  try {
    const idsToRemove = cart.lines
      .map((line) => line.id)
      .filter((id): id is string => Boolean(id));

    //console.log('Line IDs to remove from cart:', idsToRemove);

    if (idsToRemove.length) {
      await removeFromCart(idsToRemove);
      revalidateTag(TAGS.cart);
      console.log('🛒 Cart emptied after draft order creation');
    }
  } catch (err) {
    console.error('⚠️ Failed to empty cart after draft order:', err);
  }

  // ⚡ Optional: redirect user to confirmation page
  // redirect('/quote-submitted');
}
