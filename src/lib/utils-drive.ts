export const convertDriveLink = (originalLink: string): string => {
    if (!originalLink) return "";

    // If it's already a converted direct link, return it
    if (originalLink.includes("drive.google.com/uc?") || originalLink.includes("lh3.googleusercontent.com/d/")) {
        return originalLink;
    }

    // Extract the file ID from various Drive link formats:
    // 1. https://drive.google.com/file/d/FILE_ID/view...
    // 2. https://drive.google.com/open?id=FILE_ID
    // 3. https://drive.google.com/uc?id=FILE_ID
    const match = originalLink.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
        originalLink.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (!match || !match[1]) return originalLink;

    const fileId = match[1];

    // Using drive.usercontent.google.com/download?id=ID&export=view
    // Note: This requires <img referrerPolicy="no-referrer"> in the frontend to work reliably
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
};
