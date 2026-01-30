/** Extract Google Drive file ID from share link. Returns null if not a Drive link. */
function getDriveFileId(originalLink: string): string | null {
    if (!originalLink?.trim()) return null;
    const match =
        originalLink.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
        originalLink.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
}

/**
 * URL for embedding in <img> (e.g. admin preview). Uses Drive thumbnail API so it works
 * in browser when file is shared "Anyone with the link". Use plain <img referrerPolicy="no-referrer">.
 */
export function getDrivePreviewUrl(originalLink: string): string {
    const fileId = getDriveFileId(originalLink);
    if (!fileId) return "";
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
}

export const convertDriveLink = (originalLink: string): string => {
    if (!originalLink) return "";

    // If it's already a converted direct link, return it
    if (originalLink.includes("drive.google.com/uc?") || originalLink.includes("lh3.googleusercontent.com/d/")) {
        return originalLink;
    }

    const fileId = getDriveFileId(originalLink);
    if (!fileId) return originalLink;

    // Using drive.usercontent.google.com/download?id=ID&export=view
    // Note: This requires <img referrerPolicy="no-referrer"> in the frontend to work reliably
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
};
