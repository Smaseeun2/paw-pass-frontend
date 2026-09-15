import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchPetsFromDB } from '../services/api';
import { useAuth } from './AuthContext';

const PetContext = createContext(null);

export const PetProvider = ({ children }) => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);

  useEffect(() => {
    const loadPets = async () => {
      if (user) {
        try {
          const serverPets = await fetchPetsFromDB();
          if (Array.isArray(serverPets)) {
            setPets(serverPets);
          }
        } catch (err) {
          console.warn('서버 펫 조회 실패, 로컬 폴백:', err);
          const saved = localStorage.getItem(`paw_pass_pets_${user.email}`);
          if (saved) setPets(JSON.parse(saved));
        }
      } else {
        const saved = localStorage.getItem('paw_pass_pets_guest');
        if (saved) setPets(JSON.parse(saved));
        else setPets([]);
      }
    };
    loadPets();
  }, [user]);

  const refreshPets = async () => {
    if (user) {
      try {
        const serverPets = await fetchPetsFromDB();
        if (Array.isArray(serverPets)) {
          setPets(serverPets);
        }
      } catch (err) {
        // ...
      }
    } else {
      const saved = localStorage.getItem('paw_pass_pets_guest');
      if (saved) setPets(JSON.parse(saved));
      else setPets([]);
    }
  };

  return (
    <PetContext.Provider value={{ pets, setPets, refreshPets }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePetContext = () => useContext(PetContext);
