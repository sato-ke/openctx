/**
 * Generate a safe filename from URL
 * Based on convert.ts implementation
 */
export function generateSafeFilename(url: string): string {
    const filename = url
        .replace(/https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        + '.md'
    
    return filename
}

/**
 * Build file path from directory and filename
 */
export function buildFilePath(saveDirectory: string, filename: string): string {
    return `${saveDirectory}/${filename}`
}