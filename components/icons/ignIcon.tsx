'use client';

import Image from 'next/image';

export default function IgnIcon({ className }: { className?: string }) {
    return (
        <Image
            src="/images/ignitiv.svg"
            alt="Ignitiv Logo"
            width={50}
            height={50}
            className={className}
        />
    );
}
