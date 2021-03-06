import { fromEvent } from "@thi.ng/rstream/from/event";
import { merge, StreamMerge } from "@thi.ng/rstream/stream-merge";
import { map } from "@thi.ng/transducers/xform/map";

export enum GestureType {
    START,
    MOVE,
    DRAG,
    END,
    ZOOM,
}

export interface GestureInfo {
    pos: number[];
    click: number[];
    delta: number[];
    zoom: number;
}

export interface GestureEvent {
    [0]: GestureType;
    [1]: GestureInfo;
}

export interface GestureStreamOpts {
    zoom: number;
    minZoom: number;
    maxZoom: number;
}

/**
 * Attaches mouse & touch event listeners to given DOM element and
 * returns a stream of custom "gesture" events in the form of tuples:
 *
 * ```
 * [type, {pos, click?, delta?, zoom}]
 * ```
 *
 * The `click` and `delta` values are only present if `type ==
 * GestureType.DRAG`. Both (and `pos` too) are 2-element arrays of
 * `[x,y]` coordinates.
 *
 * The `zoom` value is always present, but is only updated with wheel
 * events. The value will be constrained to `minZoom` ... `maxZoom`
 * interval (provided via options object).
 *
 * Note: For touch events `preventDefault()` is called automatically.
 * Since Chrome 56 (other browsers too), this means the event target
 * element cannot be `document.body` anymore.
 *
 * See: https://www.chromestatus.com/features/5093566007214080
 *
 * @param el
 * @param opts
 */
export function gestureStream(el: Element, opts?: GestureStreamOpts): StreamMerge<any, GestureEvent> {
    let isDown = false,
        clickPos: number[];
    opts = Object.assign({
        zoom: 1,
        minZoom: 0.25,
        maxZoom: 4,
    }, opts);
    let zoom = Math.min(Math.max(opts.zoom, opts.minZoom), opts.maxZoom);
    return merge({
        src: [
            "mousedown", "mousemove", "mouseup",
            "touchstart", "touchmove", "touchend", "touchcancel",
            "wheel"
        ].map((e) => fromEvent(el, e)),

        xform: map((e: MouseEvent | TouchEvent | WheelEvent) => {
            let evt, type;
            if (e instanceof TouchEvent) {
                e.preventDefault();
                type = {
                    "touchstart": GestureType.START,
                    "touchmove": GestureType.DRAG,
                    "touchend": GestureType.END,
                    "touchcancel": GestureType.END
                }[e.type];
                evt = e.changedTouches[0];
            } else {
                type = {
                    "mousedown": GestureType.START,
                    "mousemove": isDown ? GestureType.DRAG : GestureType.MOVE,
                    "mouseup": GestureType.END,
                    "wheel": GestureType.ZOOM,
                }[e.type];
                evt = e;
            }
            const pos = [evt.clientX | 0, evt.clientY | 0];
            const body = <GestureInfo>{ pos, zoom };
            switch (type) {
                case GestureType.START:
                    isDown = true;
                    clickPos = pos;
                    break;
                case GestureType.END:
                    isDown = false;
                    clickPos = null;
                    break;
                case GestureType.DRAG:
                    body.click = clickPos;
                    body.delta = [pos[0] - clickPos[0], pos[1] - clickPos[1]];
                    break;
                case GestureType.ZOOM:
                    body.zoom = zoom = Math.min(Math.max(zoom + (<WheelEvent>e).deltaY, opts.minZoom), opts.maxZoom);
                    break;
                default:
            }
            return <GestureEvent>[type, body];
        })
    });
}
