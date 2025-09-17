'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import ProductSearch from 'components/product/ProductSearch';
import { useEffect } from 'react';

interface QuickOrderModalProps {
    onClose: () => void;
}

export default function QuickOrderModal({ onClose }: QuickOrderModalProps) {

    useEffect(() => {
        const handler = () => onClose();
        window.addEventListener('quick-order-close', handler);
        return () => window.removeEventListener('quick-order-close', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            {/* <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6"> */}
            <div className="bg-white rounded-2xl shadow-2xl w-[85vw] h-[85vh] relative p-6 overflow-hidden flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold mb-4 text-gray-900">Quick Order</h2>

                <ProductSearch onSelectAction={() => { }} />
            </div>
        </div>
    );
}
