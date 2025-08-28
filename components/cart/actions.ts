'use server';

import { TAGS } from 'lib/constants';
import {
  addToCart,
  cartBuyerIdentityUpdate,
  createCart,
  getCart,
  getCustomerByEmail,
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
import { NextResponse } from 'next/server';

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  const cookieStore = cookies();
  if (!selectedVariantId) {
    return 'Error adding item to cart';
  }
  const cartId = (await cookieStore).get('cartId')?.value;
  const companyLocationId = (await cookieStore).get('companyLocationId')?.value;
  const customerEmailRaw = (await cookieStore).get('user_email')?.value;
  const customerEmail = customerEmailRaw ? decodeURIComponent(customerEmailRaw) : null;
  const customerAccessToken = (await cookieStore).get('shopify_access_token')?.value;
  const buyerIdentity: CartBuyerIdentityInput = {};

  if (customerAccessToken || companyLocationId || customerEmail) {
    if (customerAccessToken) buyerIdentity.customerAccessToken = customerAccessToken;
    if (companyLocationId) buyerIdentity.companyLocationId = companyLocationId;
    if (customerEmail) buyerIdentity.email = customerEmail;
  }


  try {
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    if(cartId && (customerAccessToken || companyLocationId || customerEmail)){
      await cartBuyerIdentityUpdate({
        cartId: cartId? cartId : '',
        buyerIdentity,
      });
    }
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

export async function requestQuote(_formData: FormData): Promise<NextResponse | void> {
  console.log('🚀 requestQuote started...');

  const cart = await getCart();

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

  if (!customerEmail) {
          return NextResponse.json({ error: 'Email cookie missing' }, { status: 401 });
      }

  const customer = await getCustomerByEmail(customerEmail);
  const customerId = customer?.id;

  // 🔁 Update cart buyer identity with cookies (for pricing by location)
  const buyerIdentity: CartBuyerIdentityInput = {};
  if (customerAccessToken) buyerIdentity.customerAccessToken = customerAccessToken;
  if (companyLocationId) buyerIdentity.companyLocationId = companyLocationId;
  if (customerEmail) buyerIdentity.email = customerEmail;

   // 🛠 Update cart with buyer identity if available

  const updatedCart = await cartBuyerIdentityUpdate({
      cartId: cart.id,
      buyerIdentity,
    });
  //console.log('🔄 Cart buyer identity updated.');

  // 🧾 Prepare line items with adjusted price
    const lineItems = updatedCart.lines.map((line) => {
    const variantId = line.merchandise?.id;
    const quantity = line.quantity;
    const totalAmount = parseFloat(line.cost.totalAmount?.amount || '0');
  const currencyCode = line.cost.totalAmount?.currencyCode;

  // 💡 Calculate unit price
  const unitPrice = quantity > 0 ? totalAmount / quantity : null;

  if (!variantId || !unitPrice || !currencyCode) return null;

    return {
      variantId,
      quantity,
      priceOverride: {
    amount: unitPrice.toFixed(2),
    currencyCode, // fallback just in case
    }, // Shopify expects stringified number
      };
    }).filter(Boolean); // Remove nulls

    //console.log('🧱 Line items for draft order:', lineItems);

  const draftOrderInput: any = {
    lineItems,
    note: 'Requested quote from storefront',
    tags: ['request_quote'],
  };


  if (customerId) {
      draftOrderInput.customerId = customerId;
    } else if (customerEmail) {
      draftOrderInput.email = customerEmail;
  }

  // 🧠 Call GraphQL Admin API to create draft order
  const response = await adminGraphql(CREATE_DRAFT_ORDER, { input: draftOrderInput });

  const draftOrder = response?.draftOrderCreate?.draftOrder;
  const userErrors = response?.draftOrderCreate?.userErrors;
  const graphqlErrors = response?.errors;

  if (graphqlErrors?.length) {
    console.error('❌ GraphQL errors:', graphqlErrors);
    throw new Error(graphqlErrors[0]?.message || 'Failed to create draft order');
  }

  if (userErrors?.length) {
    console.error('⚠️ Draft order user errors:', userErrors);
    throw new Error(userErrors[0]?.message || 'Failed to create draft order');
  }

  //console.log('✅ Draft order created:', draftOrder?.id);

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
