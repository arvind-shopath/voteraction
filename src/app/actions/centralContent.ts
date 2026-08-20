'use server';

// Deprecated module — Central Content / Social Sena functionality removed.
export async function getCentralContentTasks(params?: any) { return []; }
export async function getCentralTasks(params?: any) { return []; }
export async function createCentralContentTask(data?: any) { return { success: false }; }
export async function updateCentralContentTask(id?: any, data?: any) { return { success: false }; }
export async function candidateReviewCentralWork(id?: any, action?: any, feedback?: any) { return { success: false }; }
export async function submitCentralWork(id?: any, urls?: any) { return { success: false }; }
export async function approveCentralTask(id?: any) { return { success: false }; }
export async function rejectCentralTask(id?: any, feedback?: any) { return { success: false }; }
export async function assignDesignerToTask(id?: any, designerId?: any) { return { success: false }; }
