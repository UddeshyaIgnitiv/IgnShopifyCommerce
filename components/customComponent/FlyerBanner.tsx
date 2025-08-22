"use client";

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
      className="w-full overflow-hidden"
      style={{ backgroundColor }}
    >
      <div className="flex flex-col md:flex-row w-full">
        {/* Left image */}
        <div className="relative w-full md:w-1/4 h-[200px] ">
          {image && (
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full"
            />
          )}
        </div>

        {/* Right text */}
        <div className="flex flex-col items-center md:items-start justify-center p-6 text-white w-full md:w-3/4 text-center md:text-left">
          <div className="flex flex-col md:flex-row w-full">
            <div className="relative w-full md:w-5/8 flex justify-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
                {subtitle && <p className="mt-2 text-lg">{subtitle}</p>}
              </div>
            </div>
            <div className="relative w-full md:w-3/8 flex justify-center">
              {ctaText && ctaLink && (
                <a
                  href={ctaLink}
                  className="inline-flex items-center justify-center
                  px-6 py-2
                  border border-white
                  rounded-full
                  font-medium
                  text-white
                  hover:bg-white hover:text-red-600
                  transition
                  h[50px]"
                >
                  {ctaText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
