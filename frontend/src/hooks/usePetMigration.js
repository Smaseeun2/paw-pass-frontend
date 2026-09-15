// src/hooks/usePetMigration.js
import { createPetInDB } from '../services/api';
const formatPayloadForDB = (pet) => {
  const sizeMap = {
    '소형': 'SMALL',
    '중형': 'MEDIUM',
    '대형': 'LARGE'
  };
  const hasCarrier = pet.supplies ? pet.supplies.includes('이동장/케이지') : Boolean(pet.has_carrier);
  const hasLeash = pet.supplies ? pet.supplies.includes('목줄/하네스') : Boolean(pet.has_leash);
  return {
    species: pet.species || 'DOG',
    name: String(pet.name || '').trim(),
    breed: String(pet.breed || '').trim(),
    weight: parseFloat(pet.weight) || 0,
    size: sizeMap[pet.size] || 'SMALL',
    has_carrier: hasCarrier,
    has_leash: hasLeash,
    birthDate: pet.birthDate || '',
    image: pet.image || '',
    supplies: pet.supplies || []
  };
};


// Hook to migrate guest pets from localStorage to backend.
export const usePetMigration = () => {
  const migrateGuestPets = async () => {
    const guestKey = 'paw_pass_pets_guest';
    const stored = localStorage.getItem(guestKey);
    if (!stored) return [];
    let guestPets;
    try {
      guestPets = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse guest pets JSON', e);
      return [];
    }
    if (!Array.isArray(guestPets) || guestPets.length === 0) return [];

    // Attempt to create each pet; only keep those that succeeded.
    const results = await Promise.allSettled(
      guestPets.map(async (pet) => {
        const payload = formatPayloadForDB ? formatPayloadForDB(pet) : pet; // fallback if helper not imported
        const res = await createPetInDB(payload);
        return res?.data || res;
      })
    );

    const successful = [];
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        successful.push(r.value);
      } else {
        console.warn('Guest pet migration failed for', guestPets[idx], r.reason);
      }
    });

    // Remove successfully persisted pets from localStorage.
    const remaining = guestPets.filter((_, i) => results[i].status !== 'fulfilled');
    if (remaining.length) {
      localStorage.setItem(guestKey, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(guestKey);
    }
    return successful;
  };

  return { migrateGuestPets };
};
