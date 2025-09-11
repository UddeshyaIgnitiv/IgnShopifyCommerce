'use client';

import Image from 'next/image';

export default function IgnIcon({ className }: { className?: string }) {
    return (
        <Image
            src="/images/tradify.png"
            alt="Ignitiv Logo"
            width={80}
            height={80}
            className={className}
        />
    );
}
