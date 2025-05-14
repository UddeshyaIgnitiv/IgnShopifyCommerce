// components/BuilderWrapper.tsx
'use client';

import { BuilderComponent, builder } from '@builder.io/react';

// Optional: only call init here if not done elsewhere
builder.init('f5207819654341769eb944c6d04b9ee7');

export default function BuilderWrapper({ content }: { content: any }) {
  if (!content) {
    return <div>Page not found</div>;
  }

  return <BuilderComponent model="page" content={content} />;
}
