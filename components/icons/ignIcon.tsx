'use client';

import Image from 'next/image';

export default function IgnIcon({ className }: { className?: string }) {
    return (
        <Image
            src="/images/targetSupplyNew.png"
            alt="Ignitiv Logo"
            width={200}
            height={200}
            className={className}
        />
    );
}
