
class RectIter {

    constructor(public x, public y, public w, public h: number) {
    }
    *[Symbol.iterator]() {
        let x0 = this.x
        let y0 = this.y
        let xe = this.x + this.w
        let ye = this.y + this.h
        for (let y = y0; y < ye; ++y) {
            for (let x = x0; x < xe; ++x) {
                yield [x, y, rangeEdgeIdx(x0, xe - 1, x), rangeEdgeIdx(y0, ye - 1, y)]
            }
        }
    }
}

class RectFrameIter {
    constructor(public x:number, public y:number, public w:number, public h: number) {
    }
    *[Symbol.iterator]() {
        let x0 = this.x
        let y0 = this.y
        let xe = x0 + this.w - 1
        let ye = y0 + this.h - 1
        for (let x = x0; x <= xe; ++x) {
            yield [x, y0, rangeEdgeIdx(x0, xe, x), 0]
        }
        for (let y = y0 + 1; y <= ye; ++y) {
            yield [xe, y, 2, rangeEdgeIdx(y0, ye, y)]
        }
        for (let x = xe - 1; x >= x0; --x) {
            yield [x, ye, rangeEdgeIdx(x0, xe, x), 2]
        }
        for (let y = ye - 1; y >= y0; --y) {
            yield [x0, y, 0, rangeEdgeIdx(y0, ye, y)]
        }
    }
}

export function rangeEdgeIdx(from: number, to: number, idx: number): number {
    return idx == from ? 0 : idx < to ? 1 : 2
}


export function Rect(x:number, y:number, w:number, h: number) {
    return new RectIter(x, y, w, h)
}

export function RectFrame(x:number, y:number, w:number, h: number) {
    return new RectFrameIter(x, y, w, h)
}
