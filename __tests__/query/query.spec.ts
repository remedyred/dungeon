/* eslint-disable array-element-newline,array-bracket-newline */
import {Neighbors, Tile, TileMatrix, TileState} from '../../src/structures/Tile'
import {Query} from '../../src/query/Query'

export function setupQueryVars(start_x = 2, start_y = 10, start_region = -1, start_type = 'floor') {
	let tiles: TileMatrix = []
	const $tile = {
		x: start_x,
		y: start_y,
		type: start_type,
		region: start_region
	} as Pick<TileState, 'region' | 'type' | 'x' | 'y'>

	const fillTiles = [
		//          0     1     2     3     4     5     6     7     8     9    10    11    12
		/* 0  */ ['-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1'], // 0
		/* 1  */ ['-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1'], // 1
		/* 2  */ ['-1', '-1', '00', '00', '00', '-1', '03', '-1', '-1', '-1', '-1', '-1', '-1'], // 2
		/* 3  */ ['-1', '-1', '00', '00', '00', '-1', '03', '03', '03', '-1', '02', '02', '-1'], // 3
		/* 4  */ ['-1', '-1', '00', '00', '00', '-1', '03', '-1', '-1', '-1', '-1', '-1', '-1'], // 4
		/* 5  */ ['-1', '-1', '-1', '-1', '-1', '-1', '03', '-1', '-1', '-1', '-1', '-1', '-1'], // 5
		/* 6  */ ['-1', '-1', '-1', '-1', '-1', '-1', '03', '-1', '-1', '-1', '-1', '-1', '-1'], // 6
		/* 7  */ ['-1', '-1', '-1', '-1', '03', '03', '03', '-1', '01', '01', '-1', '-1', '-1'], // 7
		/* 8  */ ['-1', '-1', '-1', '-1', '-1', '-1', '03', '-1', '01', '01', '-1', '-1', '-1'], // 8
		/* 9  */ ['-1', '-1', '-1', '-1', '-1', '-1', '03', '-1', '01', '01', '-1', '-1', '-1'], // 9
		/* 10 */ ['-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1'], // 10
		/* 11 */ ['-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1'], // 11
		/* 12 */ ['-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1', '-1'] //  12
	]//             0     1     2     3     4     5     6     7     8     9    10    11    12

	for (let x = 0; x < 13; x++) {
		tiles.push([])
		for (let y = 0; y < 13; y++) {
			const region = parseInt(fillTiles[y][x])
			const fillTile = new Tile('wall', x, y, $tile.region)

			if (x === $tile.x && y === $tile.y) {
				fillTile.type = $tile.type
				fillTile.region = $tile.region
			} else if (region !== -1) {
				fillTile.type = 'floor'
				fillTile.region = region
				fillTile.regionType = region > 2 ? 'room' : 'corridor'
			}
			tiles[x].push(fillTile)
		}
	}

	for (let x = 0; x < fillTiles.length - 1; x++) {
		const fillRow = fillTiles[x]
		for (let y = 0; y < fillRow.length - 1; y++) {
			const neighbors = {} as Neighbors
			if (tiles[x][y - 1]) {
				neighbors.n = tiles[x][y - 1]
			}
			if (tiles[x + 1] && tiles[x + 1][y - 1]) {
				neighbors.ne = tiles[x + 1][y - 1]
			}
			if (tiles[x + 1] && tiles[x + 1][y]) {
				neighbors.e = tiles[x + 1][y]
			}
			if (tiles[x + 1] && tiles[x + 1][y + 1]) {
				neighbors.se = tiles[x + 1][y + 1]
			}
			if (tiles[x] && tiles[x][y + 1]) {
				neighbors.s = tiles[x][y + 1]
			}
			if (tiles[x - 1] && tiles[x - 1][y + 1]) {
				neighbors.sw = tiles[x - 1][y + 1]
			}
			if (tiles[x - 1] && tiles[x - 1][y]) {
				neighbors.w = tiles[x - 1][y]
			}
			if (tiles[x - 1] && tiles[x - 1][y - 1]) {
				neighbors.nw = tiles[x - 1][y - 1]
			}
			tiles[x][y].setNeighbors(neighbors)
		}
	}

	const tile = tiles[$tile.x][$tile.y]

	const {n, e, s, w, ne, se, sw, nw} = tile.neighbors
	const $neighbors = {n, e, s, w, ne, se, sw, nw}
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
		expect(query.get()).toStrictEqual(tiles.flat().sort())
	})

	it('.count() should return a number the length of the results', () => {
		const query = new Query(tiles)
		expect(query.count()).toBe(tiles.flat().length)
	})
})
