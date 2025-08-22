"use client";


interface MainHeroBannerProps {
  mainImage: string;
  mainTitle: string;
  mainSubtitle: string;
  mainCtaText: string;
  mainCtaLink: string;
}

export function PromotionalBanner({
  mainImage,
  mainTitle,
  mainSubtitle,
  mainCtaText,
  mainCtaLink,
}: MainHeroBannerProps) {
  return (
    <div className="relative h-[400px]  w-full">
      {mainImage && (
        <img
          src={mainImage}
          alt={mainTitle}
          className="object-cover h-[415px] w-full"
        />
      )}
      <div className="absolute bottom-0 left-0 bg-yellow-400 p-6 md:p-8 max-w-md">
        <h2 className="text-2xl md:text-3xl font-bold text-black">
          {mainTitle}
        </h2>
        <p className="mt-2 text-black">{mainSubtitle}</p>
        <a
          href={mainCtaLink}
          className="mt-4 inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition"
        >
          {mainCtaText}
        </a>
      </div>
    </div>
  );
}