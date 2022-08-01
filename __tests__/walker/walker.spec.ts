import {Walker} from '../../src/mixins'
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

	guessCorridorDirection(start: Tile): string {
		return super.guessCorridorDirection(start)
	}
}

describe('Walker', () => {
	it('should be a function', () => {
		expect(typeof Walker).toBe('function')
	})

	it('should be constructable', () => {
		const walker = new Walker()
		expect(walker).toBeInstanceOf(Walker)
	})

	it('should have a walkToEdge method', () => {
		const walker = new TestWalker()
		expect(typeof walker.walkToEdge).toBe('function')
	})

	it('should have a walkStraight method', () => {
		const walker = new TestWalker()
		expect(typeof walker.walkStraight).toBe('function')
	})

	it('should have a walk method', () => {
		const walker = new TestWalker()
		expect(typeof walker.walk).toBe('function')
	})
})
