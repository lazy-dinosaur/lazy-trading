export const fetchLocalStorage = async (key: string) => {
  try {
    const result = await chrome.storage.local.get([key]);
    return { success: true, data: result[key] };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
};
export const setLocalStorage = async (key: string, data: any) => {
  try {
    await chrome.storage.local.set({ [key]: data });
    return { success: true };
  } catch (error) {
    console.error("Failed to set pinCreated in storage:", error);
    return { success: false, error };
  }
};
