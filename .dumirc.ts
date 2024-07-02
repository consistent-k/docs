import { defineConfig } from 'dumi';

export default defineConfig({
  themeConfig: {
    name: '',
    footer: false
  },
  publicPath: '/docs/',
  history: {
    type: 'hash'
  }
});
