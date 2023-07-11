/// <reference types="@javatypes/bungee-api" />
/// <reference types="@javatypes/bukkit-api" />
/// <reference types="@javatypes/sponge-api" />

import { event, plugin, server, task } from '@ccms/api'
import { Autowired } from '@ccms/container'
import { Cmd, Config, interfaces, JSPlugin, Listener, PluginConfig } from '@ccms/plugin'

import * as fs from '@ccms/common/dist/fs'
import * as reflect from '@ccms/common/dist/reflect'

import { OpenInfo } from './type'
import { defaultConfig } from './config'
import { Material, YamlConfiguration, ItemStackArray } from './javatype'
import { MiaoGlobalStoreHolder, MiaoGlobalStoreHolderImpl } from './holder'
import { createItem, first, hasLinePermission, hasPagePermission, isBlackListItem, isMatchItemName, isWhiteListItem } from './util'

@JSPlugin({ name: 'MiaoGlobalStore', pid: 100026, cname: '喵式仓库', version: '1.1.0', author: 'MiaoWoo', source: __filename })
export class MiaoGlobalStore extends interfaces.Plugin {
    @Autowired()
    private task: task.TaskManager
    @Autowired()
    private server: server.Server

    @Config()
    private config: PluginConfig & typeof defaultConfig = defaultConfig

    private playerJoinTime: { [key: string]: number } = {}
    // 玩家名称 打开页数
    private storeOpendPlayers = new Map<string, OpenInfo>()

    private inventoryField: java.lang.reflect.Field

    load() {
        this.logger.prefix = this.config.prefix
    }

    enable() {
    }

    disable() {
        for (const [name, _] of this.storeOpendPlayers) {
            let player = this.server.getPlayer(name)
            if (player) { player.closeInventory() }
        }
    }

    @Cmd({ autoMain: true })
    mgs() { }

    cmdsell() {

    }

    cmdhelp(sender: org.bukkit.entity.Player) {
        this.cmdopen(sender)
    }

    cmdlook(sender: org.bukkit.entity.Player, target: string = '', type: string = 'default', page: string = '1') {

    }

    cmdmanager(sender: org.bukkit.entity.Player, target: string = '', type: string = 'default', page: string = '1') {
        if (!sender.hasPermission('miaoglobalstore.manager')) { return this.logger.sender(sender, '§c你没有此命令的权限!') }
        if (this.storeOpendPlayers.has(target)) {
            return this.logger.sender(sender, '§c玩家背包已打开 请勿重复打开...')
        }
        let info: OpenInfo = {
            type,
            mode: 'manager',
            username: target,
            config: this.config.config[type] || this.config.config.global || {},
            title: this.config.gui.title[type] || this.config.gui.title.default,
            page: parseInt(page)
        }
        this.storeOpendPlayers.set(sender.getName(), info)
        this.task.create(() => {
            let storeInventory = this.createInventory(sender, info)
            let items = this.getPlayerStore(info)
            storeInventory.setContents(items)
            this.task.callSyncMethod(() => sender.openInventory(storeInventory))
        }).async().submit()
    }

    createInventory(sender, info) {
        return new MiaoGlobalStoreHolder(sender, info).getInventory()
    }

    cmdopen(sender: org.bukkit.entity.Player, type: string = 'default', page: string = '1') {
        let player = sender
        if (Date.now() - this.playerJoinTime[player.getName()] < 3000) {
            return this.logger.sender(sender, '§c玩家数据初始化中 请稍候...')
        }
        if (isNaN(Number(page))) {
            return this.logger.sender(sender, '§c请正确输入你要打开的仓库页数!')
        }
        let info: OpenInfo = {
            type,
            mode: 'normal',
            username: player.getName(),
            config: this.config.config[type] || this.config.config.global || {},
            title: this.config.gui.title[type] || this.config.gui.title.default,
            page: parseInt(page)
        }
        if (info.page > info.config.page) {
            return this.logger.sender(sender, `§c当前仓库类型 ${type} 最大可用页数 ${info.config.page} 请重新输入页数!`)
        }
        if (!hasPagePermission(player, info)) {
            return this.logger.sender(sender, `§c你无权打开 ${type} 类型的第 ${page} 页仓库!`)
        }
        if (this.storeOpendPlayers.has(player.getName())) {
            return this.logger.sender(sender, '§c玩家背包已打开 请勿重复打开...')
        }
        this.storeOpendPlayers.set(player.getName(), info)
        this.task.create(() => {
            let storeInventory = this.createInventory(sender, info)
            let items = this.getPlayerStore(info)
            let locked = this.getLockedItem()
            for (let line = 0; line < info.config.line; line++) {
                if (!hasLinePermission(player, info, line + 1)) {
                    for (let index = 0; index < 9; index++) {
                        let slot = line * 9 + index
                        let item = items[slot]
                        if (!item || item.getType() == Material.AIR) {
                            items[slot] = locked
                        }
                    }
                }
            }
            storeInventory.setContents(items)
            this.task.callSyncMethod(() => player.openInventory(storeInventory))
        }).async().submit()
    }

    private getLockedItem() {
        try {
            return createItem('STAINED_GLASS_PANE', 14, this.config.gui.locked)
        } catch (error) {
        }
    }

    private getPlayerConfigFile(info: OpenInfo) {
        return fs.concat(this.getDataFolder(), 'data', info.type, `${info.username}-${info.page}.yml`)
    }

    private getPlayerConfig(info: OpenInfo) {
        let storeFile = this.getPlayerConfigFile(info)
        let store = new YamlConfiguration()
        if (fs.exists(storeFile)) {
            store.loadFromString(base.read(storeFile))
        }
        return store
    }

    private getPlayerStore(info: OpenInfo) {
        let items = new ItemStackArray(info.config.line * 9)
        let store = this.getPlayerConfig(info)
        if (!store) { return items }
        let storeItems = store.getConfigurationSection('Items')
        if (!storeItems) { return items }
        for (let i = 0; i < items.length; i++) {
            items[i] = storeItems.getItemStack(i)
        }
        return items
    }

    @Listener()
    PlayerJoinEvent(event: org.bukkit.event.player.PlayerJoinEvent) {
        this.playerJoinTime[event.getPlayer().getName()] = Date.now()
    }

    @Listener()
    PlayerQuitEvent(event: org.bukkit.event.player.PlayerQuitEvent) {
        let player = event.getPlayer()
        let playerName = player.getName()
        if (this.storeOpendPlayers.has(playerName)) {
            player.closeInventory()
            this.storeOpendPlayers.delete(playerName)
        }
        delete this.playerJoinTime[playerName]
    }

    @Listener({ ignoreCancel: false, priority: event.EventPriority.LOW })
    InventoryClickEvent(event: org.bukkit.event.inventory.InventoryClickEvent) {
        let inventory = event.getInventory()
        if (!(inventory.getHolder() instanceof MiaoGlobalStoreHolderImpl)) { return }
        let title = this.getInventoryTitle(inventory)
        let player: org.bukkit.entity.Player = event.getWhoClicked() as any
        let item = event.getCurrentItem()
        if (!this.storeOpendPlayers.has(player.getName())) { return }
        let info = this.storeOpendPlayers.get(player.getName())
        if (title != info.title) { return }
        let clickName = event.getClick().name()
        if (['SHIFT_RIGHT', 'NUMBER_KEY', 'DOUBLE_CLICK'].includes(clickName) && !hasLinePermission(player as any, info, info.config.line)) {
            return event.setCancelled(true)
        }
        if (isMatchItemName(item, this.config.gui.locked)) { return event.setCancelled(true) }
        let rawSlot = event.getRawSlot()
        let line = Math.ceil((rawSlot + 1) / 9)
        if (rawSlot < 54) {
            if (!hasLinePermission(player as any, info, line)) {
                if (event.getAction().name() == "PICKUP_ALL" ||
                    (event.getAction().name() == "PICKUP_HALF" && item.getAmount() == 1)) {
                    inventory.setItem(rawSlot, this.getLockedItem())
                    event.setCursor(item)
                    return event.setCancelled(true)
                }
                if (event.getAction().name() == "MOVE_TO_OTHER_INVENTORY") {
                    return event.setCancelled(true)
                }
                let cursor = event.getCursor()
                if (cursor && cursor.getType() != Material.AIR) {
                    this.logger.sender(player, '§c当前槽位尚未解锁 无法放入物品...')
                    return event.setCancelled(true)
                }
            }
            return
        }
        if (!item || item.getType() == Material.AIR) { return }
        if (event.getAction().name() == "MOVE_TO_OTHER_INVENTORY") {
            let moveSlot = first(inventory, item)
            if (moveSlot == -1) {
                moveSlot = inventory.firstEmpty()
            }
            if (moveSlot != -1) {
                let line = Math.ceil((moveSlot + 1) / 9)
                if (!hasLinePermission(player as any, info, line)) {
                    this.logger.sender(player, '§c当前槽位尚未解锁 无法放入物品...')
                    return event.setCancelled(true)
                }
            }
        }
        switch (info.config.mode) {
            case "white": {
                if (!isWhiteListItem(item, info.config)) {
                    event.setCancelled(true)
                    return this.logger.sender(player, this.config.message.notAllowWhite)
                }
                break
            }
            case "black": {
                if (isBlackListItem(item, info.config)) {
                    event.setCancelled(true)
                    return this.logger.sender(player, this.config.message.notAllowBlack)
                }
                break
            }
            default:
        }
    }

    private getInventoryTitle(inventory) {
        if (inventory.getTitle) { return inventory.getTitle() }
        if (!this.inventoryField) {
            this.inventoryField = inventory.class.superclass.declaredFields[0]
            this.inventoryField.setAccessible(true)
        }
        return reflect.on(this.inventoryField.get(inventory)).get("title").get()
    }

    @Listener({ priority: event.EventPriority.LOW })
    InventoryCloseEvent(event: org.bukkit.event.inventory.InventoryCloseEvent) {
        let inventory = event.getInventory()
        if (!(inventory.getHolder() instanceof MiaoGlobalStoreHolderImpl)) { return }
        let title = this.getInventoryTitle(inventory)
        let player = event.getPlayer()
        let username = player.getName()
        if (!this.storeOpendPlayers.has(username)) { return }
        let info = this.storeOpendPlayers.get(username)
        if (title != info.title) { return }
        let items = inventory.getContents()
        this.task.create(() => {
            let configFile = this.getPlayerConfigFile(info)
            let config = this.getPlayerConfig(info)
            config.set("Username", info.username)
            config.set("UUID", player.getUniqueId().toString())
            for (let line = 0; line < info.config.line; line++) {
                for (let index = 0; index < 9; index++) {
                    let slot = line * 9 + index
                    let item = items[slot]
                    if (!isMatchItemName(item, this.config.gui.locked)) {
                        config.set(`Items.${slot}`, item)
                    } else {
                        config.set(`Items.${slot}`, null)
                    }
                }
            }
            if (config.getConfigurationSection('Items')?.getKeys(false).size() > 0) {
                base.save(configFile, config.saveToString())
            } else {
                base.delete(configFile)
            }
            this.storeOpendPlayers.delete(player.getName())
        }).async().submit()
    }
}
