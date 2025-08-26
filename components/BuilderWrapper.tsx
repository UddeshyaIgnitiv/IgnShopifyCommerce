// components/BuilderWrapper.tsx
'use client';

import { BuilderComponent, builder } from '@builder.io/react';
import { useEffect, useState } from 'react';

// Optional: only call init here if not done elsewhere
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_API_KEY!);

//old code
// export default function BuilderWrapper({ content }: { content: any }) {
//   if (!content) {
//     return <div>Page not found</div>;
//   }

//   return <BuilderComponent model="page" content={content} />;
// }

export default function BuilderClient({ content }: { content: any }) {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!content || !isMounted) return null;
  return <BuilderComponent model="page" content={content} />;
}