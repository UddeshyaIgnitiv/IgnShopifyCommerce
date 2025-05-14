// app/[page]/page.tsx
import BuilderWrapper from 'components/BuilderWrapper'; // ✅ Import your client wrapper
import Prose from 'components/prose';
import { getPage } from 'lib/shopify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { page: string } }): Promise<Metadata> {
  const shopifyPage = await getPage(params.page);

  if (shopifyPage) {
    return {
      title: shopifyPage.seo?.title || shopifyPage.title,
      description: shopifyPage.seo?.description || shopifyPage.bodySummary,
      openGraph: {
        publishedTime: shopifyPage.createdAt,
        modifiedTime: shopifyPage.updatedAt,
        type: 'article'
      }
    };
  }

  // ✅ Use fetch to Builder.io CDN (server-safe)
  const builderRes = await fetch(
    `https://cdn.builder.io/api/v2/content/page?apiKey=f5207819654341769eb944c6d04b9ee7&url=/${params.page}`
  );
  const builderJson = await builderRes.json();
  const builderContent = builderJson?.results?.[0];

  if (!builderContent) return notFound();

  return {
    title: builderContent.data?.title || 'Builder Page'
  };
}

export default async function Page({ params }: { params: { page: string } }) {
  const shopifyPage = await getPage(params.page);

  if (shopifyPage) {
    return (
      <>
        <h1 className="mb-8 text-5xl font-bold">{shopifyPage.title}</h1>
        <Prose className="mb-8" html={shopifyPage.body} />
        <p className="text-sm italic">
          {`This document was last updated on ${new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(new Date(shopifyPage.updatedAt))}.`}
        </p>
      </>
    );
  }

  // ✅ Fetch Builder content server-side, render via client wrapper
  const builderRes = await fetch(
    `https://cdn.builder.io/api/v2/content/page?apiKey=f5207819654341769eb944c6d04b9ee7&url=/${params.page}`
  );
  const builderJson = await builderRes.json();
  const builderContent = builderJson?.results?.[0];

  if (!builderContent) return notFound();

  return <BuilderWrapper content={builderContent} />;
}
