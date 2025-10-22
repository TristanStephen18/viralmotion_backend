export const extractPublicId = (url: string): string | null => {
  // Remove query params if any
  const cleanUrl = url.split('?')[0];

  // Match everything between /upload/ and the file extension
  const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};
