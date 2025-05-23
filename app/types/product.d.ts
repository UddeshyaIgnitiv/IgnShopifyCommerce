// /types/product.d.ts

export interface ProductOption {
  title: string;
  variantId: string;
}

export interface Product {
  id: string;
  title: string;
  variants: { id: string; title: string }[];
}
