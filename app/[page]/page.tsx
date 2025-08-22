// app/[page]/page.tsx
import BuilderWrapper from 'components/BuilderWrapper'; // ✅ Import your client wrapper
import Prose from 'components/prose';
import { getPage } from 'lib/shopify';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Optional: move this to env
const BUILDER_API_KEY = process.env.NEXT_PUBLIC_BUILDER_IO_API_KEY!;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;

  const shopifyPage = await getPage(page);

  if (shopifyPage) {
    return {
      title: shopifyPage.seo?.title || shopifyPage.title,
      description: shopifyPage.seo?.description || shopifyPage.bodySummary,
      openGraph: {
        publishedTime: shopifyPage.createdAt,
        modifiedTime: shopifyPage.updatedAt,
        type: 'article',
      },
    };
  }

  const builderRes = await fetch(
    `https://cdn.builder.io/api/v2/content/page?apiKey=${BUILDER_API_KEY}&url=/${page}`
  );
  const builderJson = await builderRes.json();
  const builderContent = builderJson?.results?.[0];

  if (!builderContent) return notFound();

  return {
    title: builderContent.data?.title || 'Builder Page',
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;

  const shopifyPage = await getPage(page);

  if (shopifyPage) {
    return (
      <>
        <h1 className="mb-8 text-5xl font-bold">{shopifyPage.title}</h1>
        <Prose className="mb-8" html={shopifyPage.body} />
        <p className="text-sm italic">
          {`This document was last updated on ${new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(new Date(shopifyPage.updatedAt))}.`}
        </p>
      </>
    );
  }

  const builderRes = await fetch(
    `https://cdn.builder.io/api/v2/content/page?apiKey=${BUILDER_API_KEY}&url=/${page}`
  );
  const builderJson = await builderRes.json();
  const builderContent = builderJson?.results?.[0];

  if (!builderContent) return notFound();

  return <BuilderWrapper content={builderContent} />;
}
