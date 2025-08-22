import Footer from 'components/layout/footer';

// app/page.tsx
import BuilderWrapper from 'components/BuilderWrapper';
// import Cookies from 'js-cookie';
// import { useEffect } from 'react';

// import { useRouter } from 'next/navigation';

export default async function HomePage() {

  const builderRes = await fetch(
    `https://cdn.builder.io/api/v2/content/page?apiKey=${process.env.BUILDER_IO_API_KEY}&url=/`
  );
  const builderJson = await builderRes.json();
  const content = builderJson?.results?.[0];

  if (!content) return <h1>Not Found</h1>;

  return (
    <>
      <BuilderWrapper content={content} />
      {/* <Carousel /> */}
      {/* <ThreeItemGrid /> */}
      <Footer />

    </>
  );


}
