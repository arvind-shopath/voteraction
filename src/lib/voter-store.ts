'use client';

/**
 * 🗳️ VOTER OFFLINE STORAGE (IndexedDB)
 * Provides robust offline-first capabilities for voter data
 */

const DB_NAME = 'VoterActionOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'voters';

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject('Window not defined');

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // We use 'id' as the keyPath (matching our database ID)
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                // We'll index by booth and epic for fast lookup
                store.createIndex('boothNumber', 'boothNumber', { unique: false });
                store.createIndex('epic', 'epic', { unique: false });
            }
        };

        request.onsuccess = (event: any) => resolve(event.target.result);
        request.onerror = (event: any) => reject(event.target.error);
    });
};

/**
 * Save a batch of voters to local storage
 */
export const saveVotersLocally = async (voters: any[]) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        voters.forEach(voter => {
            store.put(voter);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = (e: any) => reject(e.target.error);
    });
};

/**
 * Get voters from local storage based on booth
 */
export const getLocalVoters = async (boothNumber?: string): Promise<any[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        let request;
        if (boothNumber) {
            const index = store.index('boothNumber');
            request = index.getAll(boothNumber);
        } else {
            request = store.getAll();
        }

        request.onsuccess = (e: any) => resolve(e.target.result);
        request.onerror = (e: any) => reject(e.target.error);
    });
};

/**
 * Update a single voter's data locally (e.g. feedback changed offline)
 */
export const updateLocalVoter = async (voterId: number, data: any) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const getRequest = store.get(voterId);
        getRequest.onsuccess = () => {
            const voter = getRequest.result;
            if (voter) {
                const updatedVoter = { ...voter, ...data };
                store.put(updatedVoter);
            }
        };

        transaction.oncomplete = () => {
            window.dispatchEvent(new CustomEvent('local-voter-updated', { detail: { voterId, data } }));
            resolve();
        };
        transaction.onerror = (e: any) => reject(e.target.error);
    });
};

/**
 * Perform a local search/filter on stored voters
 */
export const searchLocalVoters = async (filters: any) => {
    const all = await getLocalVoters(filters.booth);

    return all.filter(v => {
        // Simple search logic
        const query = filters.search?.toLowerCase() || '';
        const matchesSearch = !query ||
            v.name?.toLowerCase().includes(query) ||
            v.relativeName?.toLowerCase().includes(query) ||
            v.epic?.toLowerCase().includes(query) ||
            v.mobile?.includes(query);

        const matchesGender = filters.gender === 'सभी' || v.gender === filters.gender;
        const matchesStatus = filters.status === 'सभी स्थिति' || v.supportStatus === filters.status;
        const matchesVillage = filters.village === 'सभी गांव' || v.village === filters.village;

        return matchesSearch && matchesGender && matchesStatus && matchesVillage;
    });
};
