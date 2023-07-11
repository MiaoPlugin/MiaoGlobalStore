import { CheckConfig, OpenInfo } from './type'
import { ItemStack, Bukkit, Material } from './javatype'

export function first(inv, item) {
    if (item == null) {
        return -1
    } else {
        let items = inv.getStorageContents()
        for (let i = 0; i < items.length; i++) {
            if (items[i] != null) {
                if (item.isSimilar(items[i])) {
                    return i
                }
            }
        }
        return -1
    }
}

export function hasPagePermission(player: org.bukkit.entity.Player, info: OpenInfo) {
    return player.hasPermission(`miaoglobalstore.${info.type}.${info.page}`) || player.hasPermission(`miaoglobalstore.${info.type}.*`)
}

export function hasLinePermission(player: org.bukkit.entity.Player, info: OpenInfo, line: number = 1) {
    return player.hasPermission(`miaoglobalstore.${info.type}.${info.page}.${line}`) || player.hasPermission(`miaoglobalstore.${info.type}.${info.page}.*`) || player.hasPermission(`miaoglobalstore.${info.type}.*`)
}

export function createItem(type: string, damage: number = 0, name: string = '', lores: string[] = []) {
    let item = new ItemStack(Material[type] || Material[Material['LEGACY_PREFIX'] + type], 1, damage)
    let meta = item.hasItemMeta() ? item.getItemMeta() : Bukkit.getItemFactory().getItemMeta(item.getType())
    if (name) { meta.setDisplayName(name) }
    if (lores) { meta.setLore(lores) }
    item.setItemMeta(meta)
    return item
}

export function isWhiteListItem(item: org.bukkit.inventory.ItemStack, config: CheckConfig) {
    if (!item || !item.hasItemMeta()) { return false }
    let meta = item.getItemMeta()
    if (meta.hasDisplayName()) {
        let itemName = meta.getDisplayName()
        for (const name of config.name) {
            if (itemName.startsWith(name) || itemName.endsWith(name)) {
                return true
            }
        }
    }
    if (meta.hasLore()) {
        let itemLore: java.util.List<string> = meta.getLore() as any
        for (const lore of config.lore) {
            if (itemLore.contains(lore)) {
                return true
            }
        }
    }
}
export function isBlackListItem(item: org.bukkit.inventory.ItemStack, config: CheckConfig) {
    if (!item || !item.hasItemMeta()) { return false }
    let meta = item.getItemMeta()
    if (meta.hasDisplayName()) {
        let itemName = meta.getDisplayName()
        for (const name of config.name) {
            if (itemName.startsWith(name) || itemName.endsWith(name)) {
                return true
            }
        }
    }
    if (meta.hasLore()) {
        let itemLore: java.util.List<string> = meta.getLore() as any
        for (const lore of config.lore) {
            if (itemLore.contains(lore)) {
                return true
            }
        }
    }
}

export function isMatchItemName(item: org.bukkit.inventory.ItemStack, name: string) {
    if (!item || !item.hasItemMeta()) { return false }
    return item.getItemMeta().getDisplayName() == name
}