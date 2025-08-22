"use client";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

export function HeroBanner({
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundImage,
}: HeroBannerProps) {
  return (
    <section
      className="relative flex items-center justify-center h-[80vh] w-full bg-cover bg-center text-white"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
      }}
    >
      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg md:text-2xl drop-shadow-md">{subtitle}</p>
        )}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="mt-6 inline-block px-6 py-3 rounded-2xl bg-white text-black font-medium shadow-lg hover:bg-gray-200 transition"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}