'use client';

type PendingAction = {
    id: string;
    type: 'CREATE_VOTER' | 'UPDATE_VOTER_FEEDBACK' | 'CREATE_JANSAMPARK' | 'UPDATE_FAMILY_SUPPORT' | 'CREATE_JANSAMPARK_ROUTE' | 'UPDATE_JANSAMPARK_ROUTE';
    payload: any;
    timestamp: number;
};

const STORAGE_KEY = 'voteraction_pending_sync';

export const getPendingActions = (): PendingAction[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const savePendingActions = (actions: PendingAction[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
};

export const queueAction = (type: PendingAction['type'], payload: any) => {
    const actions = getPendingActions();
    const newAction: PendingAction = {
        id: Math.random().toString(36).substring(2, 11),
        type,
        payload,
        timestamp: Date.now()
    };
    actions.push(newAction);
    savePendingActions(actions);

    // Trigger a custom event for UI updates
    window.dispatchEvent(new CustomEvent('offline-sync-updated'));

    return newAction;
};

export const removeAction = (id: string) => {
    const actions = getPendingActions();
    const filtered = actions.filter(a => a.id !== id);
    savePendingActions(filtered);
    window.dispatchEvent(new CustomEvent('offline-sync-updated'));
};

/**
 * Executes a function if online, otherwise queues it.
 * @param actionType The type of action for the queue
 * @param payload The payload to save
 * @param onlineFn The function to execute if online
 * @returns A promise that resolves to true if executed online, or false if queued
 */
export const executeOrQueue = async (
    actionType: PendingAction['type'],
    payload: any,
    onlineFn: () => Promise<any>
): Promise<{ success: boolean, status: 'ONLINE' | 'QUEUED' | 'ERROR', error?: any }> => {

    if (typeof window !== 'undefined' && !navigator.onLine) {
        queueAction(actionType, payload);
        return { success: true, status: 'QUEUED' };
    }

    try {
        await onlineFn();
        return { success: true, status: 'ONLINE' };
    } catch (error) {
        // If it's a network error (not a functional error), we might want to queue it too
        // But for now, let's just queue if it's explicitly offline or if it fails and we are unsure
        console.error('Server action failed, queuing for retry:', error);
        queueAction(actionType, payload);
        return { success: true, status: 'QUEUED' };
    }
};
