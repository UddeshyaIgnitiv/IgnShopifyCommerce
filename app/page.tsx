import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';

// export const metadata = {
//   description:
//     'High-performance ecommerce store built with Next.js, Vercel, and Shopify.',
//   openGraph: {
//     type: 'website'
//   }
// };

// export default function HomePage() {
//   return (
//     <>
//       <ThreeItemGrid />
//       <Carousel />
//       <Footer />
//     </>
//   );
// }


// app/page.tsx
import BuilderWrapper from 'components/BuilderWrapper';

export default async function HomePage() {
  const builderRes = await fetch(
    `https://cdn.builder.io/api/v2/content/page?apiKey=f5207819654341769eb944c6d04b9ee7&url=/`
  );
  const builderJson = await builderRes.json();
  const content = builderJson?.results?.[0];

  console.log("content", content);

  if (!content) return <h1>Not Found</h1>;

  return (
    <>
      <BuilderWrapper content={content} />
      <Carousel />
      <ThreeItemGrid />
      <Footer />
    </>
  );
  
  
}
