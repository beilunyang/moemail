import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "MoeMail",
  description: "一个基于 NextJS + Cloudflare 技术栈构建的可爱临时邮箱服务🎉",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/start' },
      { text: '开发', link: '/LocalDevelopment' },
      { text: 'API', link: '/api' },
      { text: '其他', link: '/FAQ' }
    ],
    outlineTitle: "本页目录",
    logo: "/moemail.png",
    search: {
      provider: 'local'
    },
    sidebar: [
      {
        text: '使用',
        items: [
          { 
            text: '快速开始',
            link: '/start',
            items: [
              { text: '准备', link: '/start#准备' },
              { text: 'Github Actions', link: '/start#github-actions-部署' },
              { text: '环境变量', link: '/start#环境变量' },
              { text: '邮件路由配置', link: '/start#cloudflare-邮件路由配置' }
            ] 
          },
          { text: '权限系统', link: '/AuthoritySystem' }
        ]
      },
      {
        text: '开发',
        items: [
          { text: '本地开发', link: '/LocalDevelopment' },
          { 
            text: 'API', 
            link: '/api',
            items: [
              { text: 'WebHook', link: '/api#webhook-集成' },
              { text: 'OpenAPI', link: '/api#openapi' }
            ] 
          }
        ]
      },
      {
        text: '其他',
        items: [
          { text: 'FAQ', link: '/FAQ' },
          { text: '捐赠', link: '/Donate' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/beilunyang/moemail' }
    ],
    footer: {
      message: "Released under the MIT License",
      copyright: "Copyright © 2024-2025 MoeMail",
    }
  }
})
