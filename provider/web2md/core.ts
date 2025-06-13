import TurndownService from 'turndown'
import { encode } from 'gpt-tokenizer'
import { findSiteHandler, type ExtractedContent } from './sites/index.js'
import { getVSCodeAPI } from './utils/vscode.js'
import { generateSafeFilename, buildFilePath } from './utils/file.js'
import type { Settings } from './types.js'

/**
 * Validate if URL is supported
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url)
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Extract content from HTML using site handlers
 */
export function extractContent(html: string, url: string): ExtractedContent {
    const handler = findSiteHandler(url)
    const result = handler.extractContent(html)
    if (!result) {
        throw new Error('Could not extract content from the page')
    }
    return result
}

/**
 * Create Turndown service with custom rules
 */
export function createTurndownService(url: string): TurndownService {
    const handler = findSiteHandler(url)
    
    // Define Node constants for Turndown compatibility
    if (typeof global !== 'undefined' && !global.Node) {
        (global as any).Node = {
            ELEMENT_NODE: 1,
            ATTRIBUTE_NODE: 2,
            TEXT_NODE: 3,
            CDATA_SECTION_NODE: 4,
            ENTITY_REFERENCE_NODE: 5,
            ENTITY_NODE: 6,
            PROCESSING_INSTRUCTION_NODE: 7,
            COMMENT_NODE: 8,
            DOCUMENT_NODE: 9,
            DOCUMENT_TYPE_NODE: 10,
            DOCUMENT_FRAGMENT_NODE: 11,
            NOTATION_NODE: 12
        }
    }
    
    const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
    })
    
    // Apply handler rules
    const rules = handler.getTurndownRules()
    for (const rule of rules) {
        turndown.addRule(rule.name, {
            filter: rule.filter,
            replacement: rule.replacement,
        })
    }
    
    return turndown
}

/**
 * Count tokens in a string
 */
export function countTokens(text: string): number {
    return encode(text).length
}

/**
 * Truncate Markdown content while preserving structure
 */
function truncateMarkdown(content: string, maxTokens: number): string {
    const lines = content.split('\n')
    let result: string[] = []
    let currentTokens = 0
    
    for (const line of lines) {
        const lineTokens = countTokens(line + '\n')
        if (currentTokens + lineTokens > maxTokens) {
            // Add truncation notice
            result.push('\n... (content truncated)')
            break
        }
        result.push(line)
        currentTokens += lineTokens
    }
    
    return result.join('\n')
}

/**
 * Remove unwanted elements from HTML
 */
function preprocessDOM(doc: Document, removeTags: string[]): void {
    if (removeTags.length === 0) return
    
    
    // Use DOM API to remove unwanted elements
    let totalRemoved = 0
    for (const selector of removeTags) {
        try {
            const elements = doc.querySelectorAll(selector)
            const elementsArray = Array.from(elements)
            
            for (const element of elementsArray) {
                if (element && typeof element.remove === 'function') {
                    element.remove()
                    totalRemoved++
                }
            }
        } catch (error) {
            // Silently continue on selector errors
        }
    }
    
    if (totalRemoved > 0) {
        console.log(`[web2md] Removed ${totalRemoved} unwanted elements`)
    }
    
}

/**
 * Convert HTML to Markdown
 */
export function convertToMarkdown(extractedContent: ExtractedContent, maxTokens: number, url: string): string {
    const handler = findSiteHandler(url)
    const removeTags = handler.getRemoveTags?.() || []
    
    // Parse content with domino for DOM manipulation
    const domino = require('@mixmark-io/domino')
    const doc = domino.createDocument(extractedContent.content)
    
    // Use DOM API to remove unwanted tags
    preprocessDOM(doc, removeTags)
    
    // Get cleaned HTML from DOM
    const cleanedContent = doc.body ? doc.body.innerHTML : extractedContent.content
    
    const turndown = createTurndownService(url)
    const markdown = turndown.turndown(cleanedContent)
    
    // Build final content
    const header = `<!--
Fetched from: ${url}
Converted by: OpenCtx web2md provider
Processing: Removed images, scripts, and normalized code blocks using Turndown
-->

# ${extractedContent.title}

`
    
    const fullContent = header + markdown
    const fullTokens = countTokens(fullContent)
    
    // Truncate if necessary
    if (fullTokens > maxTokens) {
        return truncateMarkdown(fullContent, maxTokens)
    }
    
    return fullContent
}

/**
 * Save markdown file locally and mention to Cody
 * Returns the saved file path if successful, null otherwise
 */
export async function saveMarkdownLocally(
    markdown: string,
    url: string,
    title: string,
    settings: Settings
): Promise<string | null> {
    // Check if local save is enabled
    if (!settings.saveLocal || !settings.saveDirectory) {
        return null
    }
    
    // Get VSCode API
    const vscode = getVSCodeAPI()
    if (!vscode) {
        console.warn('[web2md] VSCode API not available, skipping local save')
        return null
    }
    
    try {
        // Get workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders
        if (!workspaceFolders || workspaceFolders.length === 0) {
            console.warn('[web2md] No workspace folder found')
            return null
        }
        
        const workspaceRoot = workspaceFolders[0].uri
        
        // Generate filename and path
        const filename = generateSafeFilename(url)
        const relativePath = buildFilePath(settings.saveDirectory, filename)
        
        // Create directory URI
        const dirUri = vscode.Uri.joinPath(workspaceRoot, settings.saveDirectory)
        
        // Ensure directory exists
        try {
            await vscode.workspace.fs.createDirectory(dirUri)
        } catch (error) {
            // Directory might already exist, continue
        }
        
        // Create file URI
        const fileUri = vscode.Uri.joinPath(workspaceRoot, relativePath)
        
        // Write file
        const encoder = new TextEncoder()
        await vscode.workspace.fs.writeFile(fileUri, encoder.encode(markdown))
        
        // Mention file to Cody
        try {
            await vscode.commands.executeCommand('cody.mention.file', fileUri)
            console.log(`[web2md] File saved and mentioned to Cody: ${relativePath}`)
        } catch (error) {
            console.warn('[web2md] Failed to mention file to Cody:', error)
        }
        
        return relativePath
    } catch (error) {
        console.error('[web2md] Failed to save file locally:', error)
        return null
    }
}