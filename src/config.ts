export const defaultConfig = {
    prefix: '§6[§e§l斗罗大陆 §c仓库系统§6] ',
    message: {
        notAllowBlack: '§c当前物品处于此仓库黑名单中 无法放入!',
        notAllowWhite: '§c当前物品未处于此仓库白名单中 无法放入!',
    },
    gui: {
        mode: {
            look: '§6[§7只读§6]§r',
            manager: '§6[§c管理§6]§r'
        },
        title: {
            default: '§e§l斗罗大陆 §c§l仓库',
            local: '§e§l斗罗大陆 §c§lVIP仓库',
            activity: '§e§l斗罗大陆 §d§l活动物品仓库',
            global: '§e§l斗罗大陆 §4§lVIP跨服仓库'
        },
        locked: '§c§l未解锁'
    },
    config: {
        default: {
            mode: 'none',
            line: 6,
            page: 9,
            name: [],
            lore: []
        },
        local: {
            mode: 'none',
            line: 6,
            page: 3,
            name: [],
            lore: []
        },
        activity: {
            mode: 'white',
            line: 3,
            page: 1,
            name: ['§f† §d活动'],
            lore: []
        },
        global: {
            mode: 'black',
            line: 6,
            page: 1,
            name: ['§d武魂 §f'],
            lore: ['  §6† §f已绑定玩家:']
        }
    }
}