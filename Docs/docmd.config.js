module.exports = {
  siteTitle: 'Sairin',
  srcDir: 'docs',
  outputDir: 'site',

  search: true,
  autoTitleFromH1: true,
  copyCode: true,

  theme: {
    name: 'ruby',
    defaultMode: 'system',
    enableModeToggle: true,
  },

  navigation: [
    { title: 'Home', path: '/', icon: 'home' },
    {
      title: 'Getting Started',
      icon: 'rocket',
      collapsible: true,
      children: [
        { title: 'Quick Start', path: '/getting-started/quickstart/' },
        { title: 'Configuration', path: '/getting-started/configuration/' },
      ],
    },
    {
      title: 'Guide',
      icon: 'book',
      collapsible: true,
      children: [
        { title: 'Path System', path: '/guide/path-system/' },
        { title: 'Signals', path: '/guide/signals/' },
        { title: 'Effects', path: '/guide/effects/' },
        { title: 'Derived', path: '/guide/derived/' },
        { title: 'Batching', path: '/guide/batching/' },
        { title: 'Locks', path: '/guide/locks/' },
      ],
    },
    {
      title: 'API Reference',
      icon: 'code',
      collapsible: true,
      children: [
        { title: 'Kernel', path: '/api/kernel/' },
        { title: 'Store', path: '/api/store/' },
        { title: 'Flow', path: '/api/flow/' },
        { title: 'Async', path: '/api/async/' },
      ],
    },
  ],

  footer: 'Sairin. Apache License v2.0.',
};
