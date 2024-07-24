## Primer SX to CSS Converter

This is a small utility to help with migrating React code using [Primer](https://primer.style/) from CSS-in-JS to CSS Modules. It's available in two forms: a web UI, and a VSCode extension.

### Web UI

See https://iansan5653.github.io/primer-sx-to-css-converter/

### VSCode extension

The VSCode extension integrations conversion directly into your editor. To use the extension after install:

1. Select a CSS-in-JS object. You can either select the entire object including surrounding braces, or you can select a few lines from within the object
2. Use the [command palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) to execute one of the two commands:
   - _Convert sx to CSS and copy to clipboard_ will convert the object and write the result to your clipboard
   - _Convert sx to CSS and copy to module file_ will convert the object, then append it to a corresponding `module.css` file. If the file doesn't exist, it will be created. The text is inserted as a snippet, so you can press <kbd>Tab</kbd> once to highlight and quickly edit the class name
