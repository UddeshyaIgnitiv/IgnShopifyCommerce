"use client";


interface PromoCard {
  title: string;
  subtitle: string;
  discount: string;
  image: string;
  link: string;
}

interface PromoGridProps {
  promoCards: PromoCard[];
}

export function PromoGrid({ promoCards = [] }: PromoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {promoCards.map((card, i) => (
        <a
          key={i}
          href={card.link}
          className="relative h-[200px] bg-gray-100 overflow-hidden group"
        >
          <img
            src={card.image}
            alt={card.title}
            className="object-cover group-hover:scale-105 transition"
          />
          <div className="absolute bottom-0 left-0 w-full bg-yellow-400 p-3">
            <p className="text-xs font-bold text-black">
              SAVE <span className="text-lg">{card.discount}</span>
            </p>
            <p className="text-sm text-black">{card.subtitle}</p>
          </div>
        </a>
      ))}
    </div>
  );
}