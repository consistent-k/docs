import { DefaultTheme, defineConfig } from 'vitepress'

export default defineConfig({
    title: "consistent的文档",
    description: "一些文档",
    base: '/docs/',
    themeConfig: {
        nav: [
            { text: '简介', link: '/guide/start' },
            { text: '环境配置', link: '/environment/homebrew' }
        ],

        sidebar: {
            '/guide/': { base: '/guide/', items: sidebarGuide() },
            '/environment/': { base: '/environment/', items: sidebarEnvironment() }
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/consistent-k/docs' }
        ],


        docFooter: {
            prev: '上一页',
            next: '下一页'
        },

        outline: {
            label: '页面导航'
        },

        lastUpdated: {
            text: '最后更新于',
            formatOptions: {
                dateStyle: 'short',
                timeStyle: 'medium'
            }
        },

        returnToTopLabel: '回到顶部',

    }
})

function sidebarGuide(): DefaultTheme.SidebarItem[] {
    return [
        {
            text: '简介',
            link: 'start'
        }
    ]
}

function sidebarEnvironment(): DefaultTheme.SidebarItem[] {
    return [
        {
            text: '环境配置',
            items: [
                { text: 'Homebrew', link: 'homebrew' },
                { text: 'Git', link: 'git' },
                { text: 'Iterm2', link: 'iterm2' },
                { text: 'Node.js', link: 'nodejs' }
            ]
        }
    ]
}
