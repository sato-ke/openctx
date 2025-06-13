/**
 * Get VSCode API if available
 * Returns undefined in non-VSCode environments
 */
export function getVSCodeAPI(): typeof import('vscode') | undefined {
    // Check if openctx global exists
    if (!('openctx' in global)) {
        return undefined
    }
    
    const openctx = (global as any).openctx
    
    // Check if vscode API is available
    if (!openctx.vscode) {
        return undefined
    }
    
    return openctx.vscode as typeof import('vscode')
}