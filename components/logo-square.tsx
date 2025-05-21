'use client';

import clsx from 'clsx';
import IgnIcon from './icons/ignIcon';

export default function LogoSquare({ size }: { size?: 'sm' | undefined }) {
  return (
    <div
      className={clsx(
        'flex flex-none items-center justify-center mt-[30px]',
        {
          'h-[72px] w-[180px] rounded-xl': !size,
          'h-[30px] w-[30px] rounded-lg': size === 'sm'
        }
      )}
    >
      <IgnIcon
        className={clsx({
          'h-[72px] w-[180px]': !size,
          'h-[30px] w-[30px]': size === 'sm'
        })}
      />
    </div>
  );
}
