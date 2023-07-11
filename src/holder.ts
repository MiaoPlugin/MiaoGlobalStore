import { OpenInfo } from './type'
import { Bukkit, InventoryHolder } from './javatype'

export const MiaoGlobalStoreHolderImpl = Java.extend(InventoryHolder)
const createHolder = new Function('cls', 'getInventory', 'getHolder', `
return new cls() {
    getInventory: getInventory,
    getHolder: getHolder
}`)

export class MiaoGlobalStoreHolder {
    private player: org.bukkit.entity.Player
    private info: OpenInfo
    private inventory: any
    private holder: any

    constructor(player: any, info: OpenInfo) {
        this.player = player
        this.info = info
        this.holder = createHolder(
            MiaoGlobalStoreHolderImpl,
            () => this.inventory,
            () => this,
        )
        this.inventory = Bukkit.createInventory(this.holder, info.config.line * 9, info.title)
    }

    getPlayer() {
        return this.player
    }

    getInfo() {
        return this.info
    }

    getInventory() {
        return this.inventory
    }

    getHolder() {
        return this.holder
    }
}
