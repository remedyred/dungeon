import {Tile} from '../src'

describe('Tile', () => {
	it('Tile objects should contain an x property', () => {
		expect(new Tile('floor', 2, 10, -1).x).toBe(2)
	})

	it('Tile objects should contain an y property', () => {
		expect(new Tile('floor', 2, 10, -1).x).toBe(2)
	})

	it('Tile objects should contain a region property', () => {
		expect(new Tile('floor', 2, 10, -1).region).toBe(-1)
	})

	it('Tile objects should contain a type property', () => {
		expect(new Tile('floor', 2, 10, -1).type).toBe('floor')
	})
})
