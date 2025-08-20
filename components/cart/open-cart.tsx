import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function OpenCart({
  className,
  quantity
}: {
  className?: string;
  quantity?: number;
}) {
  return (
    // <div className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white">
    <div className="relative flex h-12 w-12 items-center justify-center rounded-md text-white transition-colors cursor-pointer">
      <ShoppingCartIcon
        strokeWidth={2}
        className={clsx('h-5 transition-all ease-in-out hover:scale-110', className)}
      />

      {quantity ? (
        <div className="absolute right-0 top-0 h-4 w-4 rounded-sm bg-secondary text-[11px] font-medium text-black">
          {quantity}
        </div>
      ) : null}
    </div>
  );
}
