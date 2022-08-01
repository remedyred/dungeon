import {setupQueryVars} from './query/query.spec'
import {Corridor} from '../src/structures/Corridor'
import {TileType} from '../src/structures/Tile'

describe('Corridor', () => {
	const region_id = 0
	const {tiles} = setupQueryVars()
	const corridorTiles = tiles.flat().filter(tile => tile.y === 6 && tile.x > 2 && tile.x < 5)
	let expected: {region: number; tiles: {x: number; y: number; type: TileType}[]}

	beforeEach(() => {
		expected = {
			region: region_id,
			tiles: corridorTiles.map(tile => tile.toJSON())
		}
	})

	it('should be a function', () => {
		expect(typeof Corridor).toBe('function')
	})

	it('should be constructable', () => {
		expect(new Corridor(region_id, corridorTiles)).toBeTruthy()
	})

	it('should have a .length property', () => {
		expect(typeof new Corridor(region_id, corridorTiles).length).toBe('number')
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

	it('should have a .toJSON() method', () => {
		expect(typeof Corridor.prototype.toJSON).toBe('function')
	})

	it('.toJSON() should return a corridor object', () => {
		expect(new Corridor(region_id, corridorTiles).toJSON()).toStrictEqual(expected)
	})

	it('should have a .toString() method', () => {
		expect(typeof Corridor.prototype.toString).toBe('function')
	})

	it('should have a .toString() method that returns the region', () => {
		expect(new Corridor(region_id, corridorTiles).toString()).toBe(String(region_id))
	})

	it('should be iterable', () => {
		expect(typeof Corridor.prototype[Symbol.iterator]).toBe('function')
	})

	it('should iterate over the tiles', () => {
		const corridor = new Corridor(region_id, corridorTiles)
		const iteratedTiles = []
		for (const tile of corridor) {
			iteratedTiles.push(tile)
		}
		expect(iteratedTiles).toStrictEqual(corridor.tiles)
	})
})
