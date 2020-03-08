export interface Size{
    w:number
    h:number
}

export function wh(sz:Size) : [number, number] {
    return [sz.w, sz.h]
}
