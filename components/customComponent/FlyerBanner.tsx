"use client";

import Image from "next/image";

interface FlyerBannerProps {
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
}

export function FlyerBanner({
  image,
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundColor = "#d91c24", // default red
}: FlyerBannerProps) {
  return (
    <section
      className="w-full flex flex-col md:flex-row items-center overflow-hidden rounded-xl"
      style={{ backgroundColor }}
    >
      {/* Left image */}
      <div className="relative w-full md:w-1/2 h-[200px] md:h-[250px]">
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Right text */}
      <div className="flex flex-col items-center md:items-start justify-center p-6 text-white md:w-1/2 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        {subtitle && <p className="mt-2 text-lg">{subtitle}</p>}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="mt-4 inline-block px-6 py-2 border border-white rounded-full text-white font-medium hover:bg-white hover:text-black transition"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}