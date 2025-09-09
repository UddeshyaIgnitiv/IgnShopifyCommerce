'use client';

import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

type InventoryLevel = {
  node: {
    id: string;
    location: {
      name: string;
      fulfillsOnlineOrders: boolean;
      hasActiveInventory: boolean;
      isActive: boolean;
      isPrimary: boolean;
    };
    quantities: {
      quantity: number;
      name: string;
    }[];
  };
};

export default function InventorySelect({
  inventoryLevels,
}: {
  inventoryLevels: InventoryLevel[];
}) {
  const [selected, setSelected] = useState<string>('');

  const setInventoryCookie = (locationId: string, quantity: number) => {
    Cookies.set(
      'selectedInventory',
      JSON.stringify({ locationId, quantity }),
      { expires: 7 } // cookie valid for 7 days
    );
  };
  // Auto-select primary location on mount
  useEffect(() => {
    const primary = inventoryLevels.find((lvl) => lvl.node.location.isPrimary);
    if (primary) {
      setSelected(primary.node.id);
      const available =
        primary.node.quantities.find((q) => q.name === 'available')
          ?.quantity ?? 0;

      setInventoryCookie(primary.node.id, available);
    }
  }, [inventoryLevels]);

   const handleChange = (value: string) => {
    setSelected(value);

    const chosen = inventoryLevels.find((lvl) => lvl.node.id === value);
    if (chosen) {
      const available =
        chosen.node.quantities.find((q) => q.name === 'available')
          ?.quantity ?? 0;
        console.log("Selected Location ID:", chosen.node.id);
        console.log("Available Quantity:", available);
      setInventoryCookie(chosen.node.id, available);
    }
  };

  return (
    <div className="w-full max-w-sm mb-4">
      <label
        htmlFor="inventorySelect"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Select Inventory Location
      </label>
      <select
        id="inventorySelect"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2"
      >
        <option value="">-- Choose a location --</option>
        {inventoryLevels.map((level) => {
          const available = level.node.quantities.find(
            (q) => q.name === 'available'
          )?.quantity;
          return (
            <option key={level.node.id} value={level.node.id}>
              {level.node.location.name} ({available} available)
            </option>
          );
        })}
      </select>

      {selected && (
        <p className="mt-2 text-sm text-gray-600">
          Selected:{" "}
          {
            inventoryLevels.find((lvl) => lvl.node.id === selected)?.node
              .location.name
          }
        </p>
      )}
    </div>
  );
}
