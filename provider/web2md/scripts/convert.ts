import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createRequire } from 'module'
import web2mdProvider from '../index.js'

// Enable require in ESM
const require = createRequire(import.meta.url)
;(global as any).require = require

// Setup Node constants for turndown compatibility
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

/**
 * Convert URL to Markdown and save to file
 */
async function convertUrl(url: string) {
    console.log(`🌐 Converting: ${url}`)

    try {
        // Test mentions
        const mentions = await web2mdProvider.mentions!({ query: url }, { maxTokens: 20000 })

        if (mentions.length === 0) {
            console.log('❌ No content found')
            return
        }

        const mention = mentions[0]
        console.log(`✅ Title: ${mention.title}`)

        // Test items to get markdown content
        const items = await web2mdProvider.items!({ mention }, {})

        if (items.length === 0 || !items[0].ai?.content) {
            console.log('❌ No markdown content generated')
            return
        }

        const markdown = items[0].ai.content

        // Create safe filename from URL
        const filename = url
            .replace(/https?:\/\//, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            + '.md'

        // Ensure output directory exists
        mkdirSync('./out', { recursive: true })

        // Save to file
        const filepath = join('./out', filename)
        writeFileSync(filepath, markdown, 'utf-8')

        console.log(`📝 Saved to: ${filepath}`)
        console.log(`📊 Size: ${Math.round(markdown.length / 1024)}KB`)

    } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Main function
 */
async function main() {
    const url = process.argv[2]

    if (!url) {
        console.log('Usage: pnpm convert <URL>')
        process.exit(1)
    }

    console.log('🚀 Web2MD Converter\n')
    await convertUrl(url)
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error)
}

export { convertUrl }
