/**
 * Mock data for testing core functions
 */

import type { MarkdownPage, Settings } from '../../types.js'

/**
 * Sample markdown pages for testing
 */
export const MOCK_MARKDOWN_PAGES: MarkdownPage[] = [
    {
        h1Title: 'Overview',
        h2Headings: ['Architecture', 'Features', 'Getting Started'],
        summary: 'Project overview and main features for developers',
        content: `# Overview

This is the main overview page that provides comprehensive information about the project.

## Architecture

The system follows a modular architecture pattern.

## Features

Key features include:
- Fast performance
- Easy integration
- Comprehensive documentation

## Getting Started

Follow these steps to get started with the project.`,
        size: 1500,
    },
    {
        h1Title: 'API Reference',
        h2Headings: ['REST API', 'GraphQL API', 'Authentication', 'Rate Limiting', 'Error Handling'],
        summary: 'Complete API documentation for developers and integrators',
        content: `# API Reference

Complete documentation for all available APIs.

## REST API

The REST API provides standard HTTP endpoints.

## GraphQL API

GraphQL endpoint for flexible data querying.

## Authentication

API authentication using JWT tokens.

## Rate Limiting

API calls are rate limited to prevent abuse.

## Error Handling

Standard error response format and codes.`,
        size: 3200,
    },
    {
        h1Title: 'Installation Guide',
        h2Headings: ['Prerequisites', 'Installation', 'Configuration'],
        summary: 'Step-by-step installation and setup instructions',
        content: `# Installation Guide

Complete installation instructions for all platforms.

## Prerequisites

System requirements and dependencies.

## Installation

Download and install the software.

## Configuration

Configure the application for your environment.`,
        size: 1800,
    },
    {
        h1Title: 'Advanced Configuration',
        h2Headings: ['Environment Variables', 'Custom Settings', 'Performance Tuning'],
        summary: 'Advanced configuration options and performance optimization',
        content: `# Advanced Configuration

Advanced configuration for power users.

## Environment Variables

Configure using environment variables.

## Custom Settings

Customize behavior with configuration files.

## Performance Tuning

Optimize performance for your use case.`,
        size: 2100,
    },
    {
        h1Title: 'Troubleshooting',
        h2Headings: ['Common Issues', 'Debug Mode', 'Support'],
        summary: 'Common problems and their solutions',
        content: `# Troubleshooting

Solutions to common problems and issues.

## Common Issues

Frequently encountered problems and fixes.

## Debug Mode

Enable debug mode for detailed logging.

## Support

How to get help and support.`,
        size: 1200,
    },
]

/**
 * Sample pages for search testing
 */
export const SEARCH_TEST_PAGES: MarkdownPage[] = [
    {
        h1Title: 'React Hooks Guide',
        h2Headings: ['useState', 'useEffect', 'Custom Hooks'],
        summary: 'Complete guide to React Hooks for state management',
        content: '# React Hooks Guide\n\nHooks documentation...',
        size: 2500,
    },
    {
        h1Title: 'Component Lifecycle',
        h2Headings: ['Mounting', 'Updating', 'Unmounting'],
        summary: 'Understanding React component lifecycle methods',
        content: '# Component Lifecycle\n\nLifecycle documentation...',
        size: 1800,
    },
    {
        h1Title: 'State Management',
        h2Headings: ['Local State', 'Context API', 'Redux Integration'],
        summary: 'Different approaches to managing state in React',
        content: '# State Management\n\nState management patterns...',
        size: 3000,
    },
    {
        h1Title: 'Performance Optimization',
        h2Headings: ['React.memo', 'useMemo', 'useCallback'],
        summary: 'Techniques for optimizing React application performance',
        content: '# Performance Optimization\n\nOptimization techniques...',
        size: 2200,
    },
]

/**
 * Sample settings for testing
 */
export const TEST_SETTINGS: Record<string, Settings> = {
    default: {
        maxMentionItems: 20,
        maxContentSize: 25000,
        maxTokens: 0,
        debounceDelay: 300,
        enableNavigation: true,
    },
    minimal: {
        maxMentionItems: 5,
        maxContentSize: 1000,
        maxTokens: 500,
        debounceDelay: 100,
        enableNavigation: false,
    },
    large: {
        maxMentionItems: 50,
        maxContentSize: 50000,
        maxTokens: 8000,
        debounceDelay: 1000,
        enableNavigation: true,
    },
    tokenPriority: {
        maxMentionItems: 10,
        maxContentSize: 10000,
        maxTokens: 1000, // Should override maxContentSize
        debounceDelay: 300,
        enableNavigation: true,
    },
}

/**
 * Long content for size limit testing
 */
export const LONG_CONTENT_SAMPLE = `# Very Long Document

This is a very long document that will be used to test content size limiting functionality.

## Section 1

${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)}

## Section 2

${'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(100)}

## Section 3

${'Ut enim ad minim veniam, quis nostrud exercitation ullamco. '.repeat(100)}

## Section 4

${'Duis aute irure dolor in reprehenderit in voluptate velit esse. '.repeat(100)}

## Section 5

${'Excepteur sint occaecat cupidatat non proident, sunt in culpa. '.repeat(100)}

### Subsection 5.1

${'Qui officia deserunt mollit anim id est laborum. '.repeat(50)}

### Subsection 5.2

${'At vero eos et accusamus et iusto odio dignissimos. '.repeat(50)}

## Section 6

${'Et harum quidem rerum facilis est et expedita distinctio. '.repeat(100)}
`

/**
 * Content with complex markdown structure
 */
export const COMPLEX_MARKDOWN_CONTENT = `# Main Title

The following files were used as context for generating this wiki page:

This introduction paragraph should be extracted as the summary.

## Configuration

<details>
<summary>Configuration Options</summary>

Configuration details here.

</details>

### Database Settings

Database configuration options:

\`\`\`json
{
  "host": "localhost",
  "port": 5432,
  "database": "myapp"
}
\`\`\`

## API Endpoints

### GET /api/users

Returns a list of users.

### POST /api/users

Creates a new user.

## Authentication

Authentication is handled via JWT tokens.

### Token Format

Tokens should be included in the Authorization header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Error Handling

Standard HTTP status codes are used:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error
`

/**
 * Expected parsing results for test validation
 */
export const EXPECTED_PARSE_RESULTS = {
    validHtmlSample: {
        pageCount: 3,
        firstPageTitle: 'Overview',
        secondPageTitle: 'Getting Started',
        thirdPageTitle: 'API Reference',
        firstPageH2Count: 0,
        secondPageH2Count: 2, // Installation, Your First Component
        thirdPageH2Count: 4, // Core APIs, React.Component, React.createElement, React.Fragment
    },
    emptyHtmlSample: {
        pageCount: 0,
    },
    largeHtmlSample: {
        pageCount: 5,
        titles: [
            'Architecture Overview',
            'Extension Development',
            'Debugging Guide',
            'Settings and Configuration',
            'Keyboard Shortcuts',
        ],
    },
}

/**
 * Error test cases
 */
export const ERROR_TEST_CASES = {
    invalidRepoNames: ['', '   ', 'invalid', 'user/', '/repo', 'user/repo/extra', 'user/ ', ' /repo'],
    malformedHtml: [
        '<html><script>self.__next_f.push([1,"broken json"]);</script></html>',
        '<html><script>invalid javascript</script></html>',
        '<html>no scripts</html>',
        '',
    ],
}
