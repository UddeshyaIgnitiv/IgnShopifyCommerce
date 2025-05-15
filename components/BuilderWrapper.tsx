// components/BuilderWrapper.tsx
'use client';

import { BuilderComponent, builder } from '@builder.io/react';

// Optional: only call init here if not done elsewhere
builder.init(process.env.BUILDER_IO_API_KEY!);

export default function BuilderWrapper({ content }: { content: any }) {
  if (!content) {
    return <div>Page not found</div>;
  }

  return <BuilderComponent model="page" content={content} />;
}
