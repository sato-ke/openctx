/**
 * Test fixtures for HTML samples from deepwiki.com
 * Based on actual HTML structure patterns found in research
 */

/**
 * Valid HTML with multiple markdown pages
 */
export const VALID_HTML_SAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <title>deepwiki.com - facebook/react</title>
  <meta charset="utf-8">
</head>
<body>
  <div id="__next"></div>
  <script>
    self.__next_f.push([1,"# Overview\\n\\nReact is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called \\"components\\". This page provides an overview of the React library and its core concepts."]);
    self.__next_f.push([1,"19:T3324,"]);
    self.__next_f.push([1,"# Getting Started\\n\\n## Installation\\n\\nYou can install React using npm or yarn:\\n\\n\`\`\`bash\\nnpm install react react-dom\\n\`\`\`\\n\\n## Your First Component\\n\\nComponents are the building blocks of React applications. Here's a simple example:\\n\\n\`\`\`jsx\\nfunction Welcome(props) {\\n  return \\u003ch1\\u003eHello, {props.name}!\\u003c/h1\\u003e;\\n}\\n\`\`\`"]);
    self.__next_f.push([1,"metadata chunk"]);
    self.__next_f.push([1,"# API Reference\\n\\n## Core APIs\\n\\nReact provides several core APIs for building components:\\n\\n## React.Component\\n\\nThe base class for React components when defined as ES6 classes.\\n\\n## React.createElement\\n\\nCreates and returns a new React element of the given type.\\n\\n## React.Fragment\\n\\nLets you group a list of children without adding extra nodes to the DOM."]);
  </script>
</body>
</html>
`

/**
 * HTML with no markdown content (empty repository)
 */
export const EMPTY_HTML_SAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <title>deepwiki.com - nonexistent/repo</title>
  <meta charset="utf-8">
</head>
<body>
  <div id="__next"></div>
  <script>
    self.__next_f.push([1,"19:T3324,"]);
    self.__next_f.push([1,"metadata only"]);
    self.__next_f.push([1,"no markdown content here"]);
    self.__next_f.push([1,"42:T5567,"]);
  </script>
</body>
</html>
`

/**
 * HTML with malformed/escaped content
 */
export const MALFORMED_HTML_SAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <title>deepwiki.com - test/repo</title>
</head>
<body>
  <script>
    self.__next_f.push([1,"# Broken Content\\nwith \\"unescaped quotes\\" that might break parsing"]);
    self.__next_f.push([1,"# Valid Page\\n\\nThis page has properly escaped content with \\u003cHTML\\u003e entities and \\"quoted text\\" that should be handled correctly by the parser."]);
    self.__next_f.push([1,"invalid json content without proper escaping"]);
  </script>
</body>
</html>
`

/**
 * Large HTML sample with many pages (simulates microsoft/vscode)
 */
export const LARGE_HTML_SAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <title>deepwiki.com - microsoft/vscode</title>
</head>
<body>
  <script>
    self.__next_f.push([1,"# Architecture Overview\\n\\n## Core Components\\n\\nVS Code is built on Electron and consists of several key components:\\n\\n## Extension Host\\n\\nThe extension host runs extensions in a separate process for security and performance.\\n\\n## Language Server Protocol\\n\\nVS Code uses LSP to communicate with language servers for rich editing features."]);
    self.__next_f.push([1,"# Extension Development\\n\\n## Getting Started\\n\\nDeveloping extensions for VS Code is straightforward with the Extension API.\\n\\n## Extension Manifest\\n\\nEvery extension needs a package.json file that describes the extension.\\n\\n## Activation Events\\n\\nExtensions are activated based on specific events or commands."]);
    self.__next_f.push([1,"# Debugging Guide\\n\\n## Built-in Debugger\\n\\nVS Code has a powerful built-in debugger that supports multiple languages.\\n\\n## Debug Configuration\\n\\nConfigure debugging through launch.json files.\\n\\n## Breakpoints\\n\\nSet breakpoints, conditional breakpoints, and logpoints for effective debugging."]);
    self.__next_f.push([1,"# Settings and Configuration\\n\\n## User Settings\\n\\nCustomize VS Code through user settings.\\n\\n## Workspace Settings\\n\\nProject-specific settings override user settings.\\n\\n## Settings Sync\\n\\nSync your settings across multiple devices using Settings Sync feature."]);
    self.__next_f.push([1,"# Keyboard Shortcuts\\n\\n## Default Shortcuts\\n\\nVS Code comes with comprehensive keyboard shortcuts.\\n\\n## Custom Shortcuts\\n\\nCustomize shortcuts through the Keyboard Shortcuts editor.\\n\\n## Chord Shortcuts\\n\\nCreate complex multi-key shortcuts for advanced workflows."]);
  </script>
</body>
</html>
`

/**
 * HTML with complex markdown content including code blocks and HTML entities
 */
export const COMPLEX_MARKDOWN_SAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <title>deepwiki.com - complex/example</title>
</head>
<body>
  <script>
    self.__next_f.push([1,"# Advanced Configuration\\n\\n\\u003cdetails\\u003e\\n\\u003csummary\\u003eThe following files were used as context for generating this wiki page:\\u003c/summary\\u003e\\n\\nThis is a complex page with HTML entities and code blocks.\\n\\n## Environment Variables\\n\\nSet up your environment:\\n\\n\`\`\`bash\\nexport NODE_ENV=production\\nexport API_KEY=\\"your-api-key\\"\\n\`\`\`\\n\\n## Custom Settings\\n\\nConfigure the application:\\n\\n\`\`\`json\\n{\\n  \\"timeout\\": 5000,\\n  \\"retries\\": 3,\\n  \\"debug\\": false\\n}\\n\`\`\`\\n\\n## Security Considerations\\n\\nAlways validate input and sanitize output to prevent XSS attacks.\\n\\n### Input Validation\\n\\nUse proper validation libraries:\\n\\n\`\`\`javascript\\nconst validator = require('validator');\\nif (!validator.isEmail(email)) {\\n  throw new Error('Invalid email');\\n}\\n\`\`\`"]);
  </script>
</body>
</html>
`

/**
 * HTML with very short content that should be ignored
 */
export const SHORT_CONTENT_HTML_SAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <title>deepwiki.com - short/content</title>
</head>
<body>
  <script>
    self.__next_f.push([1,"# Short"]);
    self.__next_f.push([1,"Too short to be valid markdown"]);
    self.__next_f.push([1,"# Valid Long Content\\n\\nThis is a valid markdown page with sufficient content to meet the minimum length requirement of 100 characters for markdown detection and processing."]);
  </script>
</body>
</html>
`

/**
 * HTML without any __next_f.push patterns
 */
export const NO_NEXT_F_HTML_SAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <title>deepwiki.com - no/patterns</title>
</head>
<body>
  <div id="content">
    <h1>Regular HTML Content</h1>
    <p>This HTML doesn't contain any Next.js RSC patterns.</p>
  </div>
  <script>
    console.log('Regular JavaScript');
    var data = { message: 'No RSC patterns here' };
  </script>
</body>
</html>
`
