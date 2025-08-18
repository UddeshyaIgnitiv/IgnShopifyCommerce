export type Maybe<T> = T | null;

export type Connection<T> = {
  edges: Array<Edge<T>>;
};

export type Edge<T> = {
  node: T;
};

export type Cart = Omit<ShopifyCart, 'lines'> & {
  lines: CartItem[];
};

export type CartProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image;
};

export type CartItem = {
  id: string | undefined;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: {
      name: string;
      value: string;
    }[];
    product: CartProduct;
  };
};

export type Collection = ShopifyCollection & {
  path: string;
};

export type Image = {
  url: string;
  altText: string;
  width: number;
  height: number;
};

export type Menu = {
  title: string;
  path: string;
};

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Page = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary: string;
  seo?: SEO;
  createdAt: string;
  updatedAt: string;
};

export type Product = Omit<ShopifyProduct, 'variants' | 'images'> & {
  variants: ProductVariant[];
  images: Image[];
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  contextualPricing: any;
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  price: Money;
};

export type SEO = {
  title: string;
  description: string;
};

export type ShopifyCart = {
  id: string | undefined;
  checkoutUrl: string;
  buyerIdentity: {
    email?: string;
    purchasingCompany: {
      location: {
        name?: string;
        id?: string;
      }
    }
  }
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  lines: Connection<CartItem>;
  totalQuantity: number;
};

export type ShopifyCollection = {
  handle: string;
  title: string;
  description: string;
  seo: SEO;
  updatedAt: string;
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  variants: Connection<ProductVariant>;
  featuredImage: Image;
  images: Connection<Image>;
  seo: SEO;
  tags: string[];
  updatedAt: string;
};

export type ShopifyCartOperation = {
  data: {
    cart: ShopifyCart;
  };
  variables: {
    cartId: string;
  };
};

// export type ShopifyCreateCartOperation = {
//   data: { cartCreate: { cart: ShopifyCart } };
// };

export interface ShopifyCreateCartOperation {
  variables: {
    lineItems?: any[]; // or CartLineInput[] if you have a type for it
    companyLocationId?: string;
    customerAccessToken?: string;
  };
  data: {
    cartCreate: {
      cart: ShopifyCart;
    };
  };
}

export interface CartBuyerIdentityInput {
  email?: string;
  companyLocationId?: string;
  customerAccessToken?: string;
}

export interface ShopifyCartBuyerIdentityUpdateOperation {
  variables: {
    cartId: string;
    buyerIdentity: CartBuyerIdentityInput;
  };
  data: {
    cartBuyerIdentityUpdate: {
      cart: ShopifyCart;
      userErrors: Array<{
        field?: string[];
        message: string;
      }>;
    };
  };
}

export type ShopifyAddToCartOperation = {
  data: {
    cartLinesAdd: {
      cart: ShopifyCart;
    };
  };
  variables: {
    cartId: string;
    lines: {
      merchandiseId: string;
      quantity: number;
    }[];
  };
};

export type ShopifyRemoveFromCartOperation = {
  data: {
    cartLinesRemove: {
      cart: ShopifyCart;
    };
  };
  variables: {
    cartId: string;
    lineIds: string[];
  };
};

export type ShopifyUpdateCartOperation = {
  data: {
    cartLinesUpdate: {
      cart: ShopifyCart;
    };
  };
  variables: {
    cartId: string;
    lines: {
      id: string;
      merchandiseId: string;
      quantity: number;
    }[];
  };
};

export type ShopifyCollectionOperation = {
  data: {
    collection: ShopifyCollection;
  };
  variables: {
    handle: string;
  };
};

export type ShopifyCollectionProductsOperation = {
  data: {
    collection: {
      products: Connection<ShopifyProduct>;
    };
  };
  variables: {
    handle: string;
    reverse?: boolean;
    sortKey?: string;
  };
};

export type ShopifyCollectionsOperation = {
  data: {
    collections: Connection<ShopifyCollection>;
  };
};

export type ShopifyMenuOperation = {
  data: {
    menu?: {
      items: {
        title: string;
        url: string;
      }[];
    };
  };
  variables: {
    handle: string;
  };
};

export type ShopifyPageOperation = {
  data: { pageByHandle: Page };
  variables: { handle: string };
};

export type ShopifyPagesOperation = {
  data: {
    pages: Connection<Page>;
  };
};

export type ShopifyProductOperation = {
  data: { product: ShopifyProduct };
  variables: {
    handle: string;
  };
};

export type ShopifyProductRecommendationsOperation = {
  data: {
    productRecommendations: ShopifyProduct[];
  };
  variables: {
    productId: string;
  };
};

export type ShopifyProductsOperation = {
  data: {
    products: Connection<ShopifyProduct>;
  };
  variables: {
    query?: string;
    reverse?: boolean;
    sortKey?: string;
  };
};

export type Customer = {
  metafields: any;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  note: string;
  verifiedEmail: boolean;
  validEmailAddress: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  numberOfOrders: number;
  amountSpent: {
    amount: string;
    currencyCode: string;
  };
  defaultAddress: Address | null;
  addresses: Address[];
  image: {
    src: string;
  } | null;
  canDelete: boolean;
  orders: Connection<{
    confirmed: boolean;
    confirmationNumber: string;
    displayAddress: {
      formatted: string;
      name: string;
    };
  }>;
  companyContactProfiles: {
    title: string;
    id: string;
    isMainContact: boolean;
    company: {
      locations: Connection<{
        id: string;
        name: string;
        catalogsCount: {
          count: number;
        };
        catalogs: Connection<{
          title: string;
          priceList: {
            name: string;
          };
        }>;
      }>;
    };
  }[];
};

export type ShopifyAdminProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  status: string;
  tags: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  totalInventory: number;
  isGiftCard: boolean;
  hasOnlyDefaultVariant: boolean;
  seo: {
    title: string;
    description: string;
  };
  featuredMedia: {
    alt: string;
    preview: {
      image: {
        url: string;
        altText: string;
      };
    };
  };
  media: {
    edges: Array<{
      node: {
        mediaContentType: string;
        alt: string;
        preview: {
          image: {
            url: string;
            altText: string;
          };
        };
      };
    }>;
  };
  options: Array<{
    id: string;
    name: string;
    values: string[];
  }>;
  metafields: {
    edges: Array<{
      node: {
        namespace: string;
        key: string;
        value: string;
        type: string;
        description: string;
      };
    }>;
  };
  variants: {
    map(arg0: (variant: { price: { amount: any; }; }) => number): number[];
    edges: Array<{
      node: {
        id: string;
        title: string;
        sku: string;
        barcode: string;
        availableForSale: boolean;
        price: string;
        compareAtPrice: string;
        contextualPricing: {
          price: {
            amount: string;
            currencyCode: string;
          };
        };
        selectedOptions: Array<{
          name: string;
          value: string;
        }>;
        image: {
          url: string;
          altText: string;
        };
        inventoryItem: {
          id: string;
          measurement: {
            weight: {
              value: number;
              unit: string;
            };
          };
        };
      };
    }>;
  };

}

type Address = {
  address1: string;
  address2: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  formattedArea?: string;
};

export type ShopifyGetCustomerByEmailOperation = {
  data: {
    customers: Connection<Customer>;
  };
  variables: {
    query: string;
  };
};

export type ShopifyAdminProductOperation = {
  variables: {
    id: string;
    companyLocationId: string;
  };
  data: {
    product: ShopifyAdminProduct; // <-- FIXED here: product is a single ShopifyAdminProduct object
  };
}
export type ShopifyAdminProductsOperation = {
  variables: {
    companyLocationId: string;
  };
  data: {
    products: {
      edges: Array<{
        node: ShopifyAdminProduct;
      }>;
    };
  };
}

// types ~ Invoice

export type MoneyV2 = {
  amount: string
  currencyCode: string
}

export type InvoiceAddress = {
  name?: string
  firstName?: string
  lastName?: string
  address1?: string
  address2?: string
  city?: string
  province?: string
  provinceCode?: string
  country?: string
  countryCodeV2?: string
  zip?: string
  phone?: string
}

export type OrderLineItem = {
  title: string
  quantity: number
  sku?: string
  originalUnitPriceSet: { shopMoney: MoneyV2 }
  totalDiscountsSet: { shopMoney: MoneyV2 }
  discountedTotalPriceSet: { shopMoney: MoneyV2 }
}

export type Order = {
  id: string
  name: string
  createdAt: string
  displayFinancialStatus: string
  totalPriceSet: { shopMoney: MoneyV2 }
  subtotalPriceSet: { shopMoney: MoneyV2 }
  totalShippingPriceSet: { shopMoney: MoneyV2 }
  totalTaxSet: { shopMoney: MoneyV2 }
  customer: {
    firstName?: string
    lastName?: string
    email?: string
  }
  shippingAddress?: InvoiceAddress
  billingAddress?: InvoiceAddress
  lineItems: {
    edges: { node: OrderLineItem }[]
  }
}

export type GetOrderResponse = {
  order: Order
}

export type GetOrderVariables = {
  id: string
}



