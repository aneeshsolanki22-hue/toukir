import assert from 'node:assert/strict'
import test from 'node:test'

test('the app paints with the single dark-gray theme background', async () => {
  const previousForceColor = process.env.FORCE_COLOR
  const previousNoColor = process.env.NO_COLOR
  process.env.FORCE_COLOR = '3'
  delete process.env.NO_COLOR

  try {
    // Import after forcing truecolor so Chalk's color support is deterministic.
    const [{default: React}, {renderToString, Text}, {Panel}, {ThemeProvider}] = await Promise.all([
      import('react'),
      import('ink'),
      import('./panel.js'),
      import('../theme.js'),
    ])

    const rendered = renderToString(
      React.createElement(
        ThemeProvider,
        {
          children: React.createElement(Panel, {
            title: 'Download',
            width: 20,
            children: React.createElement(Text, null, 'item'),
          }),
        },
      ),
    )

    // #18181b = rgb(24, 24, 27) — the fixed dark-gray background
    assert.match(rendered, /\x1b\[48;2;24;24;27m/)
  } finally {
    if (previousForceColor === undefined) delete process.env.FORCE_COLOR
    else process.env.FORCE_COLOR = previousForceColor
    if (previousNoColor === undefined) delete process.env.NO_COLOR
    else process.env.NO_COLOR = previousNoColor
  }
})
