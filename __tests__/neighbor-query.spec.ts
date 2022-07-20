import {NeighborQuery, Tile} from '../src'

describe('NeighborQuery', () => {
	let tile: Tile

	beforeEach(() => {
		tile = new Tile('floor', 2, 10, -1)
	})

	it('should be a function', () => {
		expect(typeof NeighborQuery).toBe('function')
	})

	it('should be constructable', () => {
		expect(new NeighborQuery(tile)).toBeTruthy()
	})

	it('should have a .setTile() method', () => {
		expect(typeof NeighborQuery.prototype.setTile).toBe('function')
	})

	it('should have a .levels() method', () => {
		expect(typeof NeighborQuery.prototype.levels).toBe('function')
	})

	it('should have a .cardinal() method', () => {
		expect(typeof NeighborQuery.prototype.cardinal).toBe('function')
	})

	it('should have a .intercardinal() method', () => {
		expect(typeof NeighborQuery.prototype.intercardinal).toBe('function')
	})

	it('should have a .type() method', () => {
		expect(typeof NeighborQuery.prototype.type).toBe('function')
	})

	it('should have a .notType() method', () => {
		expect(typeof NeighborQuery.prototype.notType).toBe('function')
	})

	it('should have a .get() method', () => {
		expect(typeof NeighborQuery.prototype.get).toBe('function')
	})

	it('.get() should return an array', () => {
		const query = new NeighborQuery(tile)
		expect(query.get()).toStrictEqual([])
	})
})
