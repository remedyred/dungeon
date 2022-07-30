import {Corridor, TileType} from '../src'
import {setupQueryVars} from './Query.spec'

describe('Corridor', () => {
	const region_id = 0
	let {tiles} = setupQueryVars()
	let expected: {region: number; tiles: {x: number; y: number; type: TileType}[]}

	beforeEach(() => {
		({tiles} = setupQueryVars())
		expected = {
			region: region_id,
			tiles: tiles.map(tile => tile.toJson())
		}
	})

	it('should be a function', () => {
		expect(typeof Corridor).toBe('function')
	})

	it('should be constructable', () => {
		expect(new Corridor(region_id, tiles)).toBeTruthy()
	})

	it('should have a .length property', () => {
		expect(typeof Corridor.length).toBe('number')
	})

	it('should have a .isRegion() method', () => {
		expect(typeof Corridor.prototype.isRegion).toBe('function')
	})

	it('should have a .push() method', () => {
		expect(typeof Corridor.prototype.push).toBe('function')
	})

	it('should have a .remove() method', () => {
		expect(typeof Corridor.prototype.remove).toBe('function')
	})

	it('should have a .toJson() method', () => {
		expect(typeof Corridor.prototype.toJson).toBe('function')
	})

	it('.toJson() should return a corridor object', () => {
		expect(new Corridor(region_id, tiles).toJson()).toStrictEqual(expected)
	})

	it('should have a .toString() method', () => {
		expect(typeof Corridor.prototype.toString).toBe('function')
	})

	it('should have a .toString() method', () => {
		expect(typeof Corridor.prototype.toString).toBe('function')
	})

	it('should be iterable', () => {
		expect(typeof Corridor.prototype[Symbol.iterator]).toBe('function')
	})

	it('should iterate over the tiles', () => {
		const corridor = new Corridor(region_id, tiles)
		const iteratedTiles = []
		for (const tile of corridor) {
			iteratedTiles.push(tile)
		}
		expect(iteratedTiles).toStrictEqual(corridor.tiles)
	})
})
