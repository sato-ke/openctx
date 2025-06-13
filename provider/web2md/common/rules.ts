import type { TurndownRule } from '../types.js'

/**
 * Common Turndown rules
 */
export const COMMON_RULES: Record<string, TurndownRule> = {
    removeHeadingLinks: {
        name: 'removeHeadingLinks',
        filter: (node: Node) => {
            if (node.nodeName === 'A' && node.parentElement) {
                const parent = node.parentElement
                return /^H[1-6]$/.test(parent.nodeName)
            }
            return false
        },
        replacement: (content: string, _node: Node) => content,
    },
    defaultCodeBlocks: {
        name: 'defaultCodeBlocks',
        filter: ['pre'],
        replacement: (content: string, _node: Node) => {
            return '\n```\n' + content.trim() + '\n```\n'
        },
    },
    removeImages: {
        name: 'removeImages',
        filter: (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                
                // Remove img tags
                if (element.tagName === 'IMG') {
                    return true
                }
                
                // Remove <a> tags that contain images
                if (element.tagName === 'A' && element.querySelector('img')) {
                    return true
                }
                
                // Remove any element that contains only images
                if (element.children.length > 0) {
                    const hasOnlyImages = Array.from(element.children).every(child => 
                        child.tagName === 'IMG' || 
                        (child.tagName === 'A' && child.querySelector('img'))
                    )
                    if (hasOnlyImages) {
                        return true
                    }
                }
            }
            return false
        },
        replacement: () => '', // Remove completely
    },
}