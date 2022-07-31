import {Tile, TileMatrix, TileState} from '../../src/structures/Tile'
import {Query} from '../../src/query/Query'

export function setupQueryVars(start_x = 2, start_y = 10, start_region = -1, start_type = 'floor') {
	let tiles: TileMatrix = []
	const $tile = {
		x: start_x,
		y: start_y,
		type: start_type,
		region: start_region
	} as Pick<TileState, 'region' | 'type' | 'x' | 'y'>

	for (let x = 0; x < 13; x++) {
		tiles.push([])
		for (let y = 0; y < 13; y++) {
			const fillTile = new Tile('wall', x, y, $tile.region)
			if (x > 2 && x < 5 && y > 2 && y < 5) {
				fillTile.type = 'floor'
				fillTile.regionType = 'room'
				fillTile.region = 0
			} else if (x > 7 && x < 10 && y > 7 && y < 10) {
				fillTile.type = 'floor'
				fillTile.regionType = 'room'
				fillTile.region = 1
			} else if (x === 6 && y > 0 && y < 10) {
				fillTile.type = 'floor'
				fillTile.regionType = 'corridor'
				fillTile.region = 2
			} else if (x === 5 && y === 4 || x === 5 && y === 7) {
				fillTile.type = 'door'
			}

			tiles[x].push(fillTile)
		}
	}

	const tile = tiles[$tile.x][$tile.y]

	let n = tiles[$tile.x][$tile.y + 1]
	let e = tiles[$tile.x + 1][$tile.y]
	let s = tiles[$tile.x][$tile.y - 1]
	let w = tiles[$tile.x - 1][$tile.y]
	let ne = tiles[$tile.x + 1][$tile.y + 1]
	let se = tiles[$tile.x + 1][$tile.y - 1]
	let sw = tiles[$tile.x - 1][$tile.y - 1]
	let nw = tiles[$tile.x - 1][$tile.y + 1]

	const neighbors = [
		n,
		e,
		s,
		w,
		ne,
		se,
		sw,
		nw
	]
	const $neighbors = {n, e, s, w, ne, se, sw, nw}
	tile.setNeighbors($neighbors)

	return {
		tiles,
		tile,
		$tile,
		neighbors,
		$neighbors,
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

export function getLevelsAway(tiles: TileMatrix, tile: Tile, levels = 1, inclusive = true) {
	const expected: Tile[] = []
	for (let x = tile.x - levels; x <= tile.x + levels; x++) {
		for (let y = tile.y - levels; y <= tile.y + levels; y++) {
			if (x === tile.x && y === tile.y) {
				continue
			}

			if (
				tiles[x] && tiles[x][y] &&
				(
					inclusive ||
					x === tile.x - levels ||
					x === tile.x + levels ||
					y === tile.y - levels ||
					y === tile.y + levels
				)
			) {
				expected.push(tiles[x][y])
			}
		}
	}
	return expected.sort()
}

describe('Query', () => {
	let {tiles} = setupQueryVars()

	beforeEach(() => {
		({tiles} = setupQueryVars())
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

	it('should have a .regionType() method', () => {
		expect(typeof Query.prototype.regionType).toBe('function')
	})

	it('should have a .notRegionType() method', () => {
		expect(typeof Query.prototype.notRegionType).toBe('function')
	})

	it('should have a .unique() method', () => {
		expect(typeof Query.prototype.unique).toBe('function')
	})

	it('should have a .sort() method', () => {
		expect(typeof Query.prototype.sort).toBe('function')
	})

	it('should have a .get() method', () => {
		expect(typeof Query.prototype.get).toBe('function')
	})

	it('should have a .count() method', () => {
		expect(typeof Query.prototype.count).toBe('function')
	})

	it('.get() should return an array of tiles', () => {
		const query = new Query(tiles)
		expect(query.get()).toEqual(expect.arrayContaining(tiles))
	})

	it('.count() should return a number the length of the results', () => {
		const query = new Query(tiles)
		expect(query.count()).toBe(tiles.length)
	})
})
