import {setupQueryVars} from './query.spec'
import {Query} from '../../src/query/Query'

describe('Query', () => {
	let {tiles, tile, n, e, s, w, ne, se, sw, nw} = setupQueryVars()
	let query: Query

	beforeEach(() => {
		({tiles, tile, n, e, s, w, ne, se, sw, nw} = setupQueryVars())
		query = new Query(tiles)
	})

	describe('.start()', () => {
		it('.start() should return a Query', () => {
			expect(query.start(tile)).toBeInstanceOf(Query)
		})

		beforeEach(() => {
			({tiles, tile, n, e, s, w, ne, se, sw, nw} = setupQueryVars())
			query = new Query(tiles)
			query.start(tile)
		})

		it('.cardinal() should return the cardinal neighbors of the start tile', () => {
			expect(query.cardinal().get().sort()).toEqual([
				n,
				e,
				s,
				w
			].sort())
		})

		it('.intercardinal() should return the intercardinal neighbors of the start tile', () => {
			expect(query.intercardinal().get().sort()).toEqual([
				ne,
				se,
				sw,
				nw
			].sort())
		})
	})
})
