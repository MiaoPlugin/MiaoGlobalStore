export type CheckConfig = {
    mode: 'none' | 'black' | 'white',
    line: 1 | 2 | 3 | 4 | 5 | 6,
    page: number
    name: string[],
    lore: string[]
}

export type OpenInfo = {
    type: string,
    mode: 'normal' | 'look' | 'manager',
    username: string,
    config: CheckConfig,
    title: string,
    page: number
}
