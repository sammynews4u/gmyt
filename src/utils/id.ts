export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
};

export const generateSyncKey = (): string => {
  return `sync-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
};
