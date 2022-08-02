import {Walker} from '../../src/mixins'
import {setupQueryVars} from '../query/query.spec'
import {cardinal, CardinalDirection} from '../../src/query/Query'
import Tile from '../../src/structures/Tile'

class TestWalker extends Walker {
	walkToEdge(start: Tile, direction: string, inclusive = true): Tile[] {
		return super.walkToEdge(start, direction, inclusive)
	}

	walkStraight(start: Tile, inclusive = true): Tile[] {
		return super.walkStraight(start, inclusive)
	}

	walk(start: Tile) {
		return super.walk(start)
	}

	guessCorridorDirections(start: Tile): CardinalDirection[] {
		return super.guessCorridorDirections(start)
	}

	longestCorridorDirection(start: Tile): CardinalDirection {
		return super.longestCorridorDirection(start)
	}
}

describe('Walker', () => {
	const {tiles, tile} = setupQueryVars()

	it('should be a function', () => {
		expect(typeof Walker).toBe('function')
	})

	it('should be constructable', () => {
		const walker = new Walker()
		expect(walker).toBeInstanceOf(Walker)
	})

	it('should have a .walkToEdge() method', () => {
		const walker = new TestWalker()
		expect(typeof walker.walkToEdge).toBe('function')
	})

	it('.walkToEdge() should return an array of tiles', () => {
		const walker = new TestWalker()
		const results = walker.walkToEdge(tile, 'north')
		expect(results).toContain(tile)
	})

	it('should have a .walkStraight() method', () => {
		const walker = new TestWalker()
		expect(typeof walker.walkStraight).toBe('function')
	})

	it('should have a .walk() method', () => {
		const walker = new TestWalker()
		expect(typeof walker.walk).toBe('function')
	})

	it('should have a .guessCorridorDirection() method', () => {
		const walker = new TestWalker()
		expect(typeof walker.guessCorridorDirections).toBe('function')
	})

	it('.guessCorridorDirection() should return a cardinal direction', () => {
		const walker = new TestWalker()
		const results = walker.guessCorridorDirections(tile)
		expect(cardinal).toContain(results)
	})

	it('.guessCorridorDirection() should correctly guess the corridor direction (n/s)', () => {
		const walker = new TestWalker()
		const results = walker.guessCorridorDirections(tiles[6][4])
		expect(results).toStrictEqual(['n', 's'])
	})

	it('.guessCorridorDirection() should correctly guess the corridor direction (e/w)', () => {
		const walker = new TestWalker()
		const results = walker.guessCorridorDirections(tiles[3][10])
		expect(results).toStrictEqual(['w'])
	})

	it('should have a .longestCorridorDirection() method', () => {
		const walker = new TestWalker()
		expect(typeof walker.longestCorridorDirection).toBe('function')
	})

	it('.longestCorridorDirection() should correctly give the longest corridor direction', () => {
		const walker = new TestWalker()
		const results = walker.longestCorridorDirection(tiles[6][3])
		expect(results).toBe('s')
	})
})
