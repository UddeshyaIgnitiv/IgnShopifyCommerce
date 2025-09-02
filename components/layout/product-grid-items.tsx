"use client";
import Grid from 'components/grid';
import { GridTileImage } from 'components/grid/tile';
import { Product } from 'lib/shopify/types';
import Link from 'next/link';
import PlaceHolderImage from 'public/noImage.png';
import { useState } from 'react';

export default function ProductGridItems({ products }: { products: Product[] }) {
  const productsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);


  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + productsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {currentProducts.map((product) => (
          <Grid.Item key={product.handle} className="animate-fadeIn">
            <Link
              className="relative inline-block h-full w-full"
              href={`/product/${product.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                }}
                src={
                  product.featuredImage
                    ? product.featuredImage.url
                    : PlaceHolderImage.src
                }
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </Link>
          </Grid.Item>
        ))}
      </Grid>
      <Grid className="grid-cols-1">
        <div className="flex justify-center space-x-2 py-6">
          {/* Previous button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200
            ${currentPage === 1 ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'button text-white border-gray-300 hover:button-primary-hover'}`}
          >
            Previous
          </button>
          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200
            ${page === currentPage ? 'bg-black text-white border-black' : 'button text-white border-gray-300 hover:button-primary-hover'}`}
          >
            {page}
          </button>
          ))}

          {/* Next button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors duration-200
            ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed' : 'button text-white border-gray-300 hover:button-primary-hover'}`}
          >
           Next
          </button>
        </div>
      </Grid>
    </>
  );
}
