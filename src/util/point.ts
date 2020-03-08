export interface Point {
    x: number
    y: number
}

export function xy(p: Point): [number, number] {
    return [p.x, p.y]
}