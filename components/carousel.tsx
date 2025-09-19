'use client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import Image from 'next/image';
import Link from 'next/link';
import PlaceHolderImage from 'public/noImage.png';

export function Carousel({ products }: { products: any[] }) {
  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: 'free-snap',
    slides: {
      perView: 4,
      spacing: 25,
    },
  });

  return (
    <div className="relative w-full mt-7">
      <div ref={sliderRef} className="keen-slider w-full pb-6 pt-1">
        {products.map((product, i) => {
          const productImage = product.featuredImage ? product?.featuredImage?.url : PlaceHolderImage.src;

          return (
            <div
              key={`${product.handle}-${i}`}
              className="keen-slider__slide relative flex flex-col items-center rounded-xl border bg-white shadow-md dark:bg-neutral-800"
            >
              <Link
                href={`/product/${product.handle}`}
                className="relative block h-64 w-full"
              >
                <Image
                  src={productImage}
                  alt={product.title || "Product image"}
                  fill
                  className={clsx(
                    "object-contain transition duration-300 ease-in-out hover:scale-105"
                  )}
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                />
              </Link>
              <div className="p-4 text-center">
                <p className="text-sm font-medium">{product.title}</p>
                <p className="text-sm font-semibold">
                  {product.priceRange?.maxVariantPrice?.amount}{" "}
                  {product.priceRange?.maxVariantPrice?.currencyCode}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={() => slider.current?.prev()}
        className="absolute left-2 top-1/2 -translate-y-1/2 button rounded-full p-2 "
      >
        <ChevronLeftIcon className="h-5 w-5 text-white" />
      </button>
      <button
        onClick={() => slider.current?.next()}
        className="absolute right-2 top-1/2 -translate-y-1/2 button rounded-full p-2 "
      >
        <ChevronRightIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
}
