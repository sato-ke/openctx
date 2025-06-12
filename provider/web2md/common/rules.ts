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
}