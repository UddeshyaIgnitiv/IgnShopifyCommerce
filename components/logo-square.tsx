'use client';

import clsx from 'clsx';
import IgnIcon from './icons/ignIcon';

export default function LogoSquare({ size }: { size?: 'sm' | undefined }) {
  return (
    <div
      className={clsx(
        'flex flex-none items-center justify-center',
        {
          'h-[40px] w-[100px] rounded-xl': !size,
          'h-[30px] w-[30px] rounded-lg': size === 'sm'
        }
      )}
    >
      <IgnIcon
        className={clsx({
          'h-[40px] w-[100px]': !size,
          'h-[30px] w-[30px]': size === 'sm'
        })}
      />
    </div>
  );
}
