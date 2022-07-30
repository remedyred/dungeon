import {Query, Tile} from '../src'

export function setupQueryVars() {
	let tiles: Tile[] = []
	let tile = new Tile('floor', 2, 10, -1)
	let n = new Tile('floor', 2, 11, -1)
	let e = new Tile('floor', 3, 10, -1)
	let s = new Tile('wall', 2, 9, -1)
	let w = new Tile('wall', 1, 10, -1)
	let ne = new Tile('wall', 3, 11, -1)
	let se = new Tile('wall', 3, 9, -1)
	let sw = new Tile('floor', 1, 9, -1)
	let nw = new Tile('floor', 1, 11, -1)
	tile.setNeighbors({n, e, s, w, ne, se, sw, nw})

	for (let x = 0; x < 10; x++) {
		for (let y = 0; y < 10; y++) {
			new Tile('wall', x, y, -1)
			if (x > 2 && x < 5 && y > 2 && y < 5) {
				tile.type = 'floor'
				tile.regionType = 'room'
				tile.region = 0
			} else if (x > 7 && x < 10 && y > 7 && y < 10) {
				tile.type = 'floor'
				tile.regionType = 'room'
				tile.region = 1
			} else if (x === 6 && y > 0 && y < 10) {
				tile.type = 'floor'
				tile.regionType = 'corridor'
				tile.region = 2
			} else if (x === 5 && y === 4 || x === 5 && y === 7) {
				tile.type = 'door'
			}

			tiles.push(tile)
		}
	}

	return {
		tiles,
		tile,
		n,
		e,
		s,
		w,
		ne,
		se,
		sw,
		nw
	}
}

describe('Query', () => {
	let {tiles, tile, n, e, s, w, ne, se, sw, nw} = setupQueryVars()

	beforeEach(() => {
		({tiles, tile, n, e, s, w, ne, se, sw, nw} = setupQueryVars())
	})

	it('should be a function', () => {
		expect(typeof Query).toBe('function')
	})

	it('should be constructable', () => {
		expect(new Query(tiles)).toBeTruthy()
	})

	it('should have a .setTiles() method', () => {
		expect(typeof Query.prototype.setTiles).toBe('function')
	})

	it('should have a .debug() method', () => {
		expect(typeof Query.prototype.debug).toBe('function')
	})

	it('should have a .offset() method', () => {
		expect(typeof Query.prototype.offset).toBe('function')
	})

	it('should have a .start() method', () => {
		expect(typeof Query.prototype.start).toBe('function')
	})

	it('should have a .levels() method', () => {
		expect(typeof Query.prototype.levels).toBe('function')
	})

	it('should have a .cardinal() method', () => {
		expect(typeof Query.prototype.cardinal).toBe('function')
	})

	it('should have a .intercardinal() method', () => {
		expect(typeof Query.prototype.intercardinal).toBe('function')
	})

	it('should have a .setDirections() method', () => {
		expect(typeof Query.prototype.setDirections).toBe('function')
	})

	it('should have a .setDirection() method', () => {
		expect(typeof Query.prototype.setDirection).toBe('function')
	})

	it('should have a .directions() method', () => {
		expect(typeof Query.prototype.directions).toBe('function')
	})

	it('should have a .direction() method', () => {
		expect(typeof Query.prototype.direction).toBe('function')
	})

	it('should have a .type() method', () => {
		expect(typeof Query.prototype.type).toBe('function')
	})

	it('should have a .notType() method', () => {
		expect(typeof Query.prototype.notType).toBe('function')
	})

	it('should have a .region() method', () => {
		expect(typeof Query.prototype.region).toBe('function')
	})

	it('should have a .notRegion() method', () => {
		expect(typeof Query.prototype.notRegion).toBe('function')
	})

	it('should have a .unique() method', () => {
		expect(typeof Query.prototype.unique).toBe('function')
	})

	it('should have a .get() method', () => {
		expect(typeof Query.prototype.get).toBe('function')
	})

	it('.get() should return an array of tiles', () => {
		const query = new Query(tiles)
		expect(query.get()).toEqual(expect.arrayContaining(tiles))
	})
})
