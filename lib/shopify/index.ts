import {
  HIDDEN_PRODUCT_TAG,
  SHOPIFY_GRAPHQL_ADMIN_API_ENDPOINT,
  SHOPIFY_GRAPHQL_API_ENDPOINT,
  TAGS
} from 'lib/constants';
import { isShopifyError } from 'lib/type-guards';
import { ensureStartsWith } from 'lib/utils';
import { transformAdminProductToShopifyProduct } from 'lib/utils/transformAdminProduct';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  revalidateTag
} from 'next/cache';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  addToCartMutation,
  cartBuyerIdentityUpdateMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation
} from './mutations/cart';
import { getCartQuery } from './queries/cart';
import {
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery
} from './queries/collection';
import {
  getAdminProductQuery,
  getAdminProductsQuery
} from './queries/getAdminProducts';
import { getCustomerByEmailQuery } from './queries/getCustomerByEmail';
import { getMenuQuery } from './queries/menu';
import { getPageQuery, getPagesQuery } from './queries/page';
import {
  getProductQuery,
  getProductRecommendationsQuery,
  getProductsQuery
} from './queries/product';
import {
  Cart,
  CartBuyerIdentityInput,
  Collection,
  Connection,
  Image,
  Menu,
  Page,
  Product,
  ShopifyAddToCartOperation,
  ShopifyAdminProductOperation,
  ShopifyAdminProductsOperation,
  ShopifyCart,
  ShopifyCartBuyerIdentityUpdateOperation,
  ShopifyCartOperation,
  ShopifyCollection,
  ShopifyCollectionOperation,
  ShopifyCollectionProductsOperation,
  ShopifyCollectionsOperation,
  ShopifyCreateCartOperation,
  ShopifyGetCustomerByEmailOperation,
  ShopifyMenuOperation,
  ShopifyPageOperation,
  ShopifyPagesOperation,
  ShopifyProduct,
  ShopifyProductOperation,
  ShopifyProductRecommendationsOperation,
  ShopifyProductsOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyUpdateCartOperation
} from './types';


const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, 'https://')
  : '';
const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
const adminEndpoint = `${domain}${SHOPIFY_GRAPHQL_ADMIN_API_ENDPOINT}`
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const adminKey = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;

type ExtractVariables<T> = T extends { variables: object }
  ? T['variables']
  : never;

export async function shopifyFetch<T>({
  headers,
  query,
  variables
}: {
  headers?: HeadersInit;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key,
        ...headers
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables })
      })
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    if (isShopifyError(e)) {
      throw {
        cause: e.cause?.toString() || 'unknown',
        status: e.status || 500,
        message: e.message,
        query
      };
    }

    throw {
      error: e,
      query
    };
  }
}

export async function shopifyAdminFetch<T>({
  headers,
  query,
  variables
}: {
  headers?: HeadersInit;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  try {
    const result = await fetch(adminEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminKey,
        ...headers
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables })
      })
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    if (isShopifyError(e)) {
      throw {
        cause: e.cause?.toString() || 'unknown',
        status: e.status || 500,
        message: e.message,
        query
      };
    }

    throw {
      error: e,
      query
    };
  }
}

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge?.node);
};

const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: cart.cost.totalAmount.currencyCode
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines)
  };
};

const reshapeCollection = (
  collection: ShopifyCollection
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`
  };
};

const reshapeCollections = (collections: ShopifyCollection[]) => {
  const reshapedCollections = [];

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection);

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection);
      }
    }
  }

  return reshapedCollections;
};

const reshapeImages = (images: Connection<Image>, productTitle: string) => {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`
    };
  });
};

const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) => {
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined;
  }

  const { images, variants, ...rest } = product;

  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants)
  };
};

const reshapeProducts = (products: ShopifyProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};

// export async function createCart(): Promise<Cart> {
//   const res = await shopifyFetch<ShopifyCreateCartOperation>({
//     query: createCartMutation
//   });

//   return reshapeCart(res.body.data.cartCreate.cart);
// }

export async function createCart({
  customerAccessToken,
  companyLocationId
}: {
  customerAccessToken?: string;
  companyLocationId?: string;
}): Promise<Cart> {
  const variables: ShopifyCreateCartOperation['variables'] = {
    lineItems: []
  };

  if (customerAccessToken) {
    variables.customerAccessToken = customerAccessToken;
  }

  if (companyLocationId) {
    variables.companyLocationId = companyLocationId;
  }

  const res = await shopifyFetch<ShopifyCreateCartOperation>({
    query: createCartMutation,
    variables
  });

  return reshapeCart(res.body.data.cartCreate.cart);
}

export async function cartBuyerIdentityUpdate({
  cartId,
  buyerIdentity
}: {
  cartId: string;
  buyerIdentity: CartBuyerIdentityInput;
}): Promise<Cart> {
  const variables: ShopifyCartBuyerIdentityUpdateOperation['variables'] = {
    cartId,
    buyerIdentity
  };

  const res = await shopifyFetch<ShopifyCartBuyerIdentityUpdateOperation>({
    query: cartBuyerIdentityUpdateMutation,
    variables
  });

  const { cart, userErrors } = res.body.data.cartBuyerIdentityUpdate;

  if (userErrors.length) {
    // You can handle errors however you prefer; here we just throw the first one.
    throw new Error(userErrors?.[0]?.message);
  }

  return reshapeCart(cart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines
    }
  });
  return reshapeCart(res.body.data.cartLinesAdd.cart);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds
    }
  });

  return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines
    }
  });

  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function getCart(): Promise<Cart | undefined> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId) {
    return undefined;
  }

  const res = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: { cartId }
  });

  // Old carts becomes `null` when you checkout.
  if (!res.body.data.cart) {
    return undefined;
  }

  return reshapeCart(res.body.data.cart);
}

export async function getCustomerByEmail(email: string) {
  const queryString = `email:${email}`;

  const res = await shopifyAdminFetch<ShopifyGetCustomerByEmailOperation>({
    query: getCustomerByEmailQuery,
    variables: { query: queryString },
  });

  const customerEdges = res.body?.data?.customers?.edges;

  if (!customerEdges?.length) {
    return undefined;
  }

  const customer = customerEdges?.[0]?.node;

  return customer;
}

export async function getAdminProduct({
  id,
  companyLocationId
}: {
  id: string;
  companyLocationId: string;
}) {
  const res = await shopifyAdminFetch<ShopifyAdminProductOperation>({
    query: getAdminProductQuery,
    variables: { id, companyLocationId }
  });

  return res.body?.data?.product;
}
  
export async function getAdminProducts({
  companyLocationId
}: {
  companyLocationId: string;
}) {
  const res = await shopifyAdminFetch<ShopifyAdminProductsOperation>({
    query: getAdminProductsQuery,
    variables: { companyLocationId }
  });

  const edges = res.body?.data?.products?.edges;

  if (!edges?.length) {
    return [];
  }

  return edges.map(edge => edge.node);
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyCollectionOperation>({
    query: getCollectionQuery,
    variables: {
      handle
    }
  });

  return reshapeCollection(res.body.data.collection);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
  useAdminAPI = false,
  companyLocationId
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
  useAdminAPI?: boolean;
  companyLocationId?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife('days');

  if (useAdminAPI) {
    if (!companyLocationId) {
      console.log('Admin API selected but missing companyLocationId.');
      return [];
    }

    // 1. Fetch admin products (with contextual prices)
    const adminProducts = await getAdminProducts({ companyLocationId });

    // 2. Fetch storefront products from collection (using Storefront API)
    const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
      query: getCollectionProductsQuery,
      variables: {
        handle: collection,
        reverse,
        sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey
      }
    });

    if (!res.body.data.collection) {
      console.log(`[getCollectionProducts] No collection found for \`${collection}\``);
      return [];
    }

    const storefrontProducts = reshapeProducts(
      removeEdgesAndNodes(res.body.data.collection.products)
    );

    // 3. Merge prices from admin products into storefront products
    for (const adminProduct of adminProducts) {
      const matchingProduct = storefrontProducts.find(p => p.id === adminProduct.id);
      if (matchingProduct) {
        const prices = Array.isArray(adminProduct?.variants?.edges)
            ? adminProduct.variants.edges.map(edge => Number(edge.node.contextualPricing?.price?.amount))
            : [];
      
        matchingProduct.priceRange = {
          maxVariantPrice: {
            ...matchingProduct.priceRange.maxVariantPrice,
            amount: Math.max(...prices).toString()
          },
          minVariantPrice: {
            ...matchingProduct.priceRange.minVariantPrice,
            amount: Math.min(...prices).toString()
          }
        };

        console.log(`[getCollectionProducts] Updated price range for ${matchingProduct.title}:`, matchingProduct.priceRange);

        for (const edge of adminProduct.variants.edges) {
          const adminVariant = edge.node;
          const variant = matchingProduct.variants.find(v => v.id === adminVariant.id);
          if (variant) {
            variant.price = adminVariant.contextualPricing?.price;
          } else {
            console.warn(`[getCollectionProducts] No matching storefront variant found for admin variant ID: ${adminVariant.id}`);
          }
        }
      }
    }
    return storefrontProducts;
  }

  const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
    query: getCollectionProductsQuery,
    variables: {
      handle: collection,
      reverse,
      sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey
    }
  });

  if (!res.body.data.collection) {
    console.log(`No collection found for \`${collection}\``);
    return [];
  }

  return reshapeProducts(
    removeEdgesAndNodes(res.body.data.collection.products)
  );
}

export async function getCollections(): Promise<Collection[]> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery
  });
  const shopifyCollections = removeEdgesAndNodes(res.body?.data?.collections);
  const collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      path: '/search',
      updatedAt: new Date().toISOString()
    },
    // Filter out the `hidden` collections.
    // Collections that start with `hidden-*` need to be hidden on the search page.
    ...reshapeCollections(shopifyCollections).filter(
      (collection) => !collection.handle.startsWith('hidden')
    )
  ];

  return collections;
}

export async function getMenu(handle: string): Promise<Menu[]> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyMenuOperation>({
    query: getMenuQuery,
    variables: {
      handle
    }
  });

  return (
    res.body?.data?.menu?.items.map((item: { title: string; url: string }) => ({
      title: item.title,
      path: item.url
        .replace(domain, '')
        .replace('/collections', '/search')
        .replace('/pages', '')
    })) || []
  );
}

export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<ShopifyPageOperation>({
    query: getPageQuery,
    variables: { handle }
  });

  return res.body.data.pageByHandle;
}

export async function getPages(): Promise<Page[]> {
  const res = await shopifyFetch<ShopifyPagesOperation>({
    query: getPagesQuery
  });

  return removeEdgesAndNodes(res.body.data.pages);
}

// export async function getProduct(handle: string, customerAccessToken?: string): Promise<Product | undefined> {
//   'use cache';
//   cacheTag(TAGS.products);
//   cacheLife('days');

//   const headers: HeadersInit = customerAccessToken
//     ? { 'Shopify-Customer-Access-Token': customerAccessToken }
//     : {};

//   const res = await shopifyFetch<ShopifyProductOperation>({
//     query: getProductQuery,
//     variables: {
//       handle
//     },
//     headers,
//   });

//   return reshapeProduct(res.body.data.product, false);
// }

export async function getProduct(
  handle: string,
  customerAccessToken?: string,
  useAdminAPI: boolean = false,
  companyLocationId?: string,
  productId?: string // <-- Required when using Admin API
): Promise<Product | undefined> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  if (useAdminAPI) {
    if (!companyLocationId || !productId) {
      console.log('Admin API selected but missing companyLocationId or productId.');
      return undefined;
    }
    // Use Admin API to fetch a specific product by ID for a company location
    const adminProduct = await getAdminProduct({
      id: productId,
      companyLocationId
    });

    if (!adminProduct) return undefined;

    const storefrontProduct = transformAdminProductToShopifyProduct(adminProduct);
  return reshapeProduct(storefrontProduct, false);
  }

  // Default to Storefront API
  const headers: HeadersInit = customerAccessToken
    ? { 'Shopify-Customer-Access-Token': customerAccessToken }
    : {};

  const res = await shopifyFetch<ShopifyProductOperation>({
    query: getProductQuery,
    variables: {
      handle
    },
    headers,
  });

  return reshapeProduct(res.body?.data?.product, false);
}


export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
    query: getProductRecommendationsQuery,
    variables: {
      productId
    }
  });

  return reshapeProducts(res.body.data.productRecommendations);
}

export async function getProducts({
  query,
  reverse,
  sortKey,
  useAdminAPI = false,
  companyLocationId
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  useAdminAPI?: boolean;
  companyLocationId?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');

  if (useAdminAPI) {
    if (!companyLocationId) {
      console.log('Admin API selected but missing companyLocationId.');
      return [];
    }

    // 1. Fetch admin products (with contextual pricing)
    const adminProducts = await getAdminProducts({ companyLocationId });

    // 2. Fetch storefront products using Storefront API (for general shape, title, SEO, etc.)
    const storefrontRes = await shopifyFetch<ShopifyProductsOperation>({
      query: getProductsQuery,
      variables: { query, reverse, sortKey }
    });

    const storefrontProducts = reshapeProducts(removeEdgesAndNodes(storefrontRes.body.data.products));

    // 3. Transform admin product → storefront format (contextualized)
    const adminStorefrontProducts = adminProducts.map(transformAdminProductToShopifyProduct);

    // 4. Merge contextual pricing into the matched storefront products
    for (const adminProduct of adminStorefrontProducts) {
      const matchingProduct = storefrontProducts.find(p => p.id === adminProduct.id);

      if (matchingProduct) {
        const flattenedVariants = removeEdgesAndNodes(adminProduct.variants);

        const prices = flattenedVariants.map(variant =>
          Number(variant?.price?.amount ?? 0)
        );

        if (prices.length > 0) {
          matchingProduct.priceRange = {
            maxVariantPrice: {
              ...matchingProduct.priceRange.maxVariantPrice,
              amount: Math.max(...prices).toString()
            },
            minVariantPrice: {
              ...matchingProduct.priceRange.minVariantPrice,
              amount: Math.min(...prices).toString()
            }
          };
        }

        console.log(`[getProducts] Updated price range for ${matchingProduct.title}:`, matchingProduct.priceRange);


        for (const variant of flattenedVariants) {
          const matchingVariant = matchingProduct.variants.find(v => v.id === variant.id);
          if (matchingVariant) {
            matchingVariant.price = variant.price;
          }
        }
      }
    }

    return storefrontProducts;
  }

  // Fallback: Storefront API only
  const res = await shopifyFetch<ShopifyProductsOperation>({
    query: getProductsQuery,
    variables: { query, reverse, sortKey }
  });

  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}


// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    'collections/create',
    'collections/delete',
    'collections/update'
  ];
  const productWebhooks = [
    'products/create',
    'products/delete',
    'products/update'
  ];
  const topic = (await headers()).get('x-shopify-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.SHOPIFY_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}
