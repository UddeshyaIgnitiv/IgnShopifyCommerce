'use client';

import type { ProductVariant } from 'lib/shopify/types';
import { useRouter, useSearchParams } from 'next/navigation';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

type ProductState = {
  [key: string]: string;
} & {
  image?: string;
};

type ProductContextType = {
  state: ProductState;
  updateOption: (name: string, value: string) => ProductState;
  updateImage: (index: string) => ProductState;
  selectedVariant?: ProductVariant;
  setSelectedVariant: React.Dispatch<React.SetStateAction<ProductVariant | undefined>>;
  isLoading: boolean; // required now
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({
  children,
  variants
}: {
  children: React.ReactNode;
  variants: ProductVariant[];
}) {
  const searchParams = useSearchParams();

  const getInitialState = () => {
    const params: ProductState = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  };

  const [state, setState] = useState<ProductState>(getInitialState());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();

  useEffect(() => {
    if (!variants?.length) return;

    // Find variant matching current state
    const foundVariant = variants.find((variant) =>
      variant.selectedOptions.every(
        (opt) => state[opt.name.toLowerCase()] === opt.value
      )
    );

    if (foundVariant?.id !== selectedVariant?.id) {
      setSelectedVariant(foundVariant);
    }

    // Once we do first match, loading is done
    setIsLoading(false);
  }, [state, variants, selectedVariant]);

  const updateOption = (name: string, value: string) => {
    const newState = { ...state, [name]: value };
    setState(newState);
    return newState;
  };

  const updateImage = (index: string) => {
    const newState = { ...state, image: index };
    setState(newState);
    return newState;
  };

  const value = useMemo(
    () => ({
      state,
      updateOption,
      updateImage,
      selectedVariant,
      setSelectedVariant,
      isLoading
    }),
    [state, selectedVariant, isLoading]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

export function useUpdateURL() {
  const router = useRouter();

  return (state: ProductState) => {
    const newParams = new URLSearchParams(window.location.search);
    Object.entries(state).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    router.push(`?${newParams.toString()}`, { scroll: false });
  };
}
