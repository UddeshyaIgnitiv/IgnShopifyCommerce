export const dynamic = 'force-dynamic';

import BuilderWrapper from 'components/BuilderWrapper';
import { Carousel } from 'components/carousel';
import Footer from 'components/layout/footer';
import { getCollectionProducts } from 'lib/shopify';

// import Cookies from 'js-cookie';
// import { useEffect } from 'react';

// import { useRouter } from 'next/navigation';

export default async function HomePage() {

  const builderRes = await fetch(
    `https://cdn.builder.io/api/v2/content/page?apiKey=${process.env.NEXT_PUBLIC_BUILDER_IO_API_KEY}&url=/`,
    {
      cache: 'no-store', // Optional but helps in development
    }
  );
  const builderJson = await builderRes.json();
  const content = builderJson?.results?.[0];

  const products = await getCollectionProducts({
    collection: 'hidden-homepage-carousel',
  });

  if (!content) return <h1>Not Found</h1>;

  return (
    <>
      <BuilderWrapper content={content} />
      <Carousel products={products} />
      {/* <ThreeItemGrid /> */}
      <Footer />

    </>
  );
}

