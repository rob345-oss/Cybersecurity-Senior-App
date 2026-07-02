import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  stories: [
    '../app/**/*.mdx',
    '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/nextjs-vite',
  async viteFinal(config) {
    if (config.plugins) {
      config.plugins = config.plugins.filter((plugin) => {
        const name =
          plugin && typeof plugin === 'object' && 'name' in plugin
            ? String(plugin.name)
            : ''
        return !name.includes('vite-plugin-pwa') && name !== 'vite-pwa'
      })
    }
    return config
  },
}

export default config
