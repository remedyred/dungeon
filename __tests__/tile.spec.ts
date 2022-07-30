import {directions, Query, Tile} from '../src'
import {setupQueryVars} from './query.spec'

describe('Tile', () => {
	const TILE_TYPE = 'floor'
	const TILE_X = 2
	const TILE_Y = 10
	const TILE_REGION = -1
	let {tile, neighbors, $neighbors, $tile} = setupQueryVars(TILE_X, TILE_Y, TILE_REGION, TILE_TYPE)

	it('should be a function', () => {
		expect(typeof Tile).toBe('function')
	})

	it('should be constructable', () => {
		expect(new Tile(TILE_TYPE, TILE_X, TILE_Y, TILE_REGION)).toBeTruthy()
	})

	beforeEach(() => {
		({tile, neighbors, $neighbors} = setupQueryVars(TILE_X, TILE_Y, TILE_REGION, TILE_TYPE))
	})

	it('should have a .name property that is a string', () => {
		expect(typeof tile.name).toBe('string')
	})

	it('should have a .x property that is a number', () => {
		expect(typeof tile.x).toBe('number')
	})

	it('should have a .y property that is a number', () => {
		expect(typeof tile.y).toBe('number')
	})

	it('should have a .type property that is a string', () => {
		expect(typeof tile.type).toBe('string')
	})

	it('should have a .region property that is a number', () => {
		expect(typeof tile.region).toBe('number')
	})

	it('should have a .regionType property that is a string or undefined', () => {
		expect(['undefined', 'string']).toContain(typeof tile.regionType)
	})

	it('should have a .neighbors property that is an object', () => {
		expect(typeof tile.neighbors).toBe('object')
	})

	it('should have a .setNeighbors() method', () => {
		expect(typeof Tile.prototype.setNeighbors).toBe('function')
	})

	it('should have a .getNeighbors() method', () => {
		expect(typeof Tile.prototype.getNeighbors).toBe('function')
	})

	it('.getNeighbors() should return an array of tiles', () => {
		expect(tile.getNeighbors()).toStrictEqual(neighbors)
	})

	it('should have a .getNeighbor() method', () => {
		expect(typeof Tile.prototype.getNeighbor).toBe('function')
	})

	it('should have a .offset() method', () => {
		expect(typeof Tile.prototype.offset).toBe('function')
	})

	it.each(directions)('should have a .getNeighbor() method that returns a tile', direction => {
		expect(tile.getNeighbor(direction)).toBe($neighbors[direction])
	})

	it('should have a .find() method', () => {
		expect(typeof Tile.prototype.find).toBe('function')
	})

	it('should have a .find() method that returns a query', () => {
		expect(tile.find()).toBeInstanceOf(Query)
	})

	it('should have a .isCorner() method', () => {
		expect(typeof Tile.prototype.isCorner).toBe('function')
	})

	it('should have a .isCorner() method that returns a boolean', () => {
		expect(typeof tile.isCorner()).toBe('boolean')
	})

	it('should have a .isCardinal() method', () => {
		expect(typeof Tile.prototype.isCardinal).toBe('function')
	})

	it('should have a .isCardinal() method that returns a boolean', () => {
		expect(typeof tile.isCardinal($neighbors.n)).toBe('boolean')
	})

	it('should have a .isIntercardinal() method', () => {
		expect(typeof Tile.prototype.isIntercardinal).toBe('function')
	})

	it('should have a .isIntercardinal() method that returns a boolean', () => {
		expect(typeof tile.isIntercardinal($neighbors.n)).toBe('boolean')
	})

	it('should have a .isFloor() method', () => {
		expect(typeof Tile.prototype.isFloor).toBe('function')
	})

	it('should have a .isFloor() method that returns a boolean', () => {
		expect(typeof tile.isFloor()).toBe('boolean')
	})

	it('should have a .isDoor() method', () => {
		expect(typeof Tile.prototype.isDoor).toBe('function')
	})

	it('should have a .isDoor() method that returns a boolean', () => {
		expect(typeof tile.isDoor()).toBe('boolean')
	})

	it('should have a .inRegion() method', () => {
		expect(typeof Tile.prototype.inRegion).toBe('function')
	})

	it('should have a .inRegion() method that returns a boolean', () => {
		expect(typeof tile.inRegion($tile.region)).toBe('boolean')
	})

	it('should have a .isWall() method', () => {
		expect(typeof Tile.prototype.isWall).toBe('function')
	})

	it('should have a .isWall() method that returns a boolean', () => {
		expect(typeof tile.isWall()).toBe('boolean')
	})

	it('should have a .isRoom() method', () => {
		expect(typeof Tile.prototype.isRoom).toBe('function')
	})

	it('should have a .isRoom() method that returns a boolean', () => {
		expect(typeof tile.isRoom()).toBe('boolean')
	})

	it('should have a .isCorridor() method', () => {
		expect(typeof Tile.prototype.isCorridor).toBe('function')
	})

	it('should have a .isCorridor() method that returns a boolean', () => {
		expect(typeof tile.isCorridor()).toBe('boolean')
	})

	it('should have a .nearDoors() method', () => {
		expect(typeof Tile.prototype.nearDoors).toBe('function')
	})

	it('should have an async .nearDoors() method that returns a boolean', async () => {
		expect(typeof await tile.nearDoors()).toBe('boolean')
	})

	it('should have a .nearDoors() method', () => {
		expect(typeof Tile.prototype.nearDoors).toBe('function')
	})

	it('should have an async .nearDoors() method that returns a boolean', async () => {
		expect(typeof await tile.nearDoors()).toBe('boolean')
	})

	it('should have a .touchesAnother() method', () => {
		expect(typeof Tile.prototype.touchesAnother).toBe('function')
	})

	it('should have an async .touchesAnother() method that returns a boolean', async () => {
		expect(typeof await tile.touchesAnother()).toBe('boolean')
	})

	it('should have a .isAtEnd() method', () => {
		expect(typeof Tile.prototype.isAtEnd).toBe('function')
	})

	it('should have an async .isAtEnd() method that returns a boolean', async () => {
		expect(typeof await tile.isAtEnd()).toBe('boolean')
	})

	it('should have a .nearRoom() method', () => {
		expect(typeof Tile.prototype.nearRoom).toBe('function')
	})

	it('should have an async .nearRoom() method that returns a boolean', async () => {
		expect(typeof await tile.nearRoom()).toBe('boolean')
	})

	it('should have a .doors() method', () => {
		expect(typeof Tile.prototype.doors).toBe('function')
	})

	it('should have an async .doors() method that returns an array', async () => {
		expect(Array.isArray(await tile.doors())).toBe(true)
	})

	it('should have a .walls() method', () => {
		expect(typeof Tile.prototype.walls).toBe('function')
	})

	it('should have an async .walls() method that returns an array', async () => {
		expect(Array.isArray(await tile.walls())).toBe(true)
	})

	it('should have a .floors() method', () => {
		expect(typeof Tile.prototype.floors).toBe('function')
	})

	it('should have an async .floors() method that returns an array', async () => {
		expect(Array.isArray(await tile.floors())).toBe(true)
	})

	it('should have a .cardinal() method', () => {
		expect(typeof Tile.prototype.cardinal).toBe('function')
	})

	it('should have an async .cardinal() method that returns an array', async () => {
		expect(Array.isArray(await tile.cardinal())).toBe(true)
	})

	it('should have a .intercardinal() method', () => {
		expect(typeof Tile.prototype.intercardinal).toBe('function')
	})

	it('should have an async .intercardinal() method that returns an array', async () => {
		expect(Array.isArray(await tile.intercardinal())).toBe(true)
	})

	it('should have a .around() method', () => {
		expect(typeof Tile.prototype.around).toBe('function')
	})

	it('should have an async .around() method that returns an array', async () => {
		expect(Array.isArray(await tile.around())).toBe(true)
	})

	it('should have a .toJSON() method', () => {
		expect(typeof Tile.prototype.toJSON).toBe('function')
	})

	it('.toJSON() should return a Tile object', () => {
		expect(tile.toJSON()).toStrictEqual($tile)
	})

	it('should have a .toString() method', () => {
		expect(typeof Tile.prototype.toString).toBe('function')
	})

	it('should have a .toString() method that returns the X,Y', () => {
		expect(tile.toString()).toBe(`${TILE_X},${TILE_Y}`)
	})
})
