
export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateSyncKey = (): string => {
  return `GMYT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};
