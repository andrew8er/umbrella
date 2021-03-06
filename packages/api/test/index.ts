import * as assert from "assert";

import { equiv } from "../src/equiv";

describe("equiv", () => {

    it("null", () => {
        assert(equiv(null, null));
        assert(equiv(null, undefined));
        assert(equiv(undefined, null));
    });

    it("boolean", () => {
        assert(!equiv(null, false));
        assert(!equiv(false, null));
        assert(!equiv(undefined, false));
        assert(!equiv(false, undefined));
    });

    it("number", () => {
        assert(!equiv(null, 0));
        assert(!equiv(0, null));
        assert(!equiv(0, undefined));
        assert(!equiv(undefined, 0));

        assert(equiv(0, 0));
        assert(equiv(0, 0.0));
        assert(!equiv(0, 1));
        assert(!equiv(1, 0));
        assert(!equiv(0, "0"));
        assert(!equiv("0", 0));
        assert(!equiv(0, [0]));
        assert(!equiv([0], 0));
    });

    it("string", () => {
        assert(!equiv(null, ""));
        assert(!equiv("", null));
        assert(equiv("a", "a"));
        assert(!equiv("a", "ab"));
    });

    it("array", () => {
        assert(equiv([], []));
        assert(equiv([], []));
        assert(equiv([], { length: 0 }));
        assert(equiv({ length: 0 }, []));
        assert(equiv(["a"], ["a"]));
        assert(!equiv(["a"], ["b"]));
    });

    it("object", () => {
        assert(!equiv(undefined, {}));
        assert(!equiv({}, undefined));
        assert(!equiv(null, {}));
        assert(!equiv({}, null));

        assert(equiv({}, {}));
        assert(!equiv({}, []));
        assert(!equiv([], {}));
        assert(equiv({ a: 0 }, { a: 0 }));
        assert(equiv({ a: 0, b: { c: 1 } }, { a: 0, b: { c: 1 } }));
        assert(!equiv({ a: 0, b: { c: 1 } }, { a: 0, b: { c: 2 } }));
        assert(!equiv({ a: 0, b: { c: 1 } }, { a: 0, b: {} }));
    });

    it("equiv impl", () => {
        class A {
            a: any;
            constructor(a) {
                this.a = a;
            }

            equiv(b) {
                return equiv(this.a, b);
            }
        }

        assert(!equiv(new A(1), null));
        assert(!equiv(new A(1), undefined));
        assert(!equiv(null, new A(1)));
        assert(!equiv(undefined, new A(1)));
        assert(equiv(new A(1), new A(1)));
        assert(equiv(new A(1), 1));
        assert(equiv(1, new A(1)));
        assert(equiv(1, { equiv(x) { return x === 1; } }));
        assert(equiv({ equiv(x) { return x === 1; } }, 1));
        assert(!equiv(new A(1), new A(2)));
        assert(!equiv(new A(1), 2));
    });

});
