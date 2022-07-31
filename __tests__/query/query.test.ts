import {getLevelsAway, setupQueryVars} from './query.spec'
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
			const expected = [
				tiles[tile.x + 1][tile.y],
				tiles[tile.x - 1][tile.y],
				tiles[tile.x][tile.y + 1],
				tiles[tile.x][tile.y - 1]
			].sort()

			expect(query.cardinal().debug().get()).toEqual(expected)
		})

		it('.intercardinal() should return the intercardinal neighbors of the start tile', () => {
			const expected = [
				tiles[tile.x + 1][tile.y + 1],
				tiles[tile.x + 1][tile.y - 1],
				tiles[tile.x - 1][tile.y + 1],
				tiles[tile.x - 1][tile.y - 1]
			].sort()
			expect(query.intercardinal().get()).toEqual(expected)
		})

		it('.levels(1) should return tiles 1 level away from the start tile', () => {
			expect(query.levels(1).get()).toEqual(getLevelsAway(tiles, tile, 1))
		})

		it('.levels(2) should return tiles 2 level away from the start tile', () => {
			expect(query.levels(2).get()).toEqual(getLevelsAway(tiles, tile, 2))
		})

		it('.levels(3) should return tiles 3 level away from the start tile', () => {
			expect(query.levels(3).get()).toEqual(getLevelsAway(tiles, tile, 3))
		})

		it('.levels(4) should return tiles 4 level away from the start tile', () => {
			expect(query.levels(4).get()).toEqual(getLevelsAway(tiles, tile, 4))
		})

		it('.levels(1, false) should only return tiles 1 level away from the start tile', () => {
			expect(query.levels(1, false).get()).toEqual(getLevelsAway(tiles, tile, 1, false))
		})

		it('.levels(2, false) should only return tiles 1 level away from the start tile', () => {
			expect(query.levels(2, false).get()).toEqual(getLevelsAway(tiles, tile, 2, false))
		})

		it('.levels(3, false) should only return tiles 1 level away from the start tile', () => {
			expect(query.levels(3, false).get()).toEqual(getLevelsAway(tiles, tile, 3, false))
		})

		it('.levels(4, false) should only return tiles 1 level away from the start tile', () => {
			expect(query.levels(4, false).get()).toEqual(getLevelsAway(tiles, tile, 4, false))
		})
	})
})
