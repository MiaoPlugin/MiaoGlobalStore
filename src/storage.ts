import { OpenInfo } from "./type"

export interface Storage {
    read(player, info: OpenInfo)
    save(player, info: OpenInfo)
}

export class FileStorage {

}

export class MySQLStorage {

}