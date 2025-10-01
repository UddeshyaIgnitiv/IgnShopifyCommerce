'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');

  const setInventoryCookie = (locationName: string, locationId: string, quantity: number) => {
    Cookies.set(
      'selectedInventory',
      JSON.stringify({ locationName, locationId, quantity }),
      { expires: 7 }
    );
  };

  // On mount → restore from cookie OR fall back to primary
  useEffect(() => {
    const cookie = Cookies.get('selectedInventory');

    if (cookie) {
      try {
        const parsed = JSON.parse(cookie);
        setSelectedLocationId(parsed.locationId);

        const chosen = inventoryLevels.find(
          (lvl) => lvl.node.id === parsed.locationId
        );
        if (chosen) {
          setSelectedLocationName(chosen.node.location.name);
          return; // stop here, don’t overwrite with primary
        }
      } catch (e) {
        console.error('Error parsing cookie:', e);
      }
    }

    // fallback: primary location
    const primary = inventoryLevels.find((lvl) => lvl.node.location.isPrimary);
    if (primary) {
      setSelectedLocationId(primary.node.id);
      setSelectedLocationName(primary.node.location.name);

      const available =
        primary.node.quantities.find((q) => q.name === 'available')?.quantity ??
        0;

      setInventoryCookie(primary.node.location.name, primary.node.id, available);
    }
  }, [inventoryLevels]);

  const handleChange = (value: string) => {
    setSelectedLocationId(value);

    const chosen = inventoryLevels.find((lvl) => lvl.node.id === value);
    if (chosen) {
      setSelectedLocationName(chosen.node.location.name);

      const available =
        chosen.node.quantities.find((q) => q.name === 'available')?.quantity ??
        0;

      setInventoryCookie(chosen.node.location.name, chosen.node.id, available);

      // refresh but selection will stick (rehydrated from cookie)
      router.refresh();
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
        value={selectedLocationId}
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

      {selectedLocationId && (
        <p className="mt-2 text-sm text-gray-600">
          Selected: {selectedLocationName}
        </p>
      )}
    </div>
  );
}
