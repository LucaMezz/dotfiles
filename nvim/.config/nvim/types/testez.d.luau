-- TestEZ globals injected at test runtime.

declare class Expectation
	to: Expectation
	be: Expectation
	been: Expectation
	is: Expectation
	was: Expectation
	has: Expectation
	have: Expectation
	at: Expectation
	never: Expectation
	ok: () -> ()
	truthy: () -> ()
	falsy: () -> ()
	equal: (expected: any) -> ()
	near: (expected: number, limit: number?) -> ()
	throw: (msg: string?) -> ()
	a: (typeName: string) -> ()
end

declare function describe(name: string, fn: () -> ()): ()
declare function describeSKIP(name: string, fn: () -> ()): ()
declare function describeFOCUS(name: string, fn: () -> ()): ()
declare function it(name: string, fn: () -> ()): ()
declare function itSKIP(name: string, fn: () -> ()): ()
declare function itFOCUS(name: string, fn: () -> ()): ()
declare function beforeEach(fn: () -> ()): ()
declare function afterEach(fn: () -> ()): ()
declare function expect(value: any): Expectation
declare function fail(msg: string?): ()
declare function FOCUS(): ()
declare function SKIP(): ()
