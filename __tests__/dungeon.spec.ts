import {Dungeon, dungeon, Results} from '../src'

describe('Dungeon', () => {
	it('dungeon should be a function', () => {
		expect(typeof dungeon).toBe('function')
	})

	it('dungeon should return an object', () => {
		expect(typeof dungeon()).toBe('object')
	})

	it('Dungeon should be constructable', () => {
		expect(new Dungeon()).toBeTruthy()
	})

	it('Dungeon should have a .build() method', () => {
		expect(typeof dungeon().build).toBe('function')
	})

	it('Dungeon.build() should return an object', () => {
		expect(typeof dungeon().build()).toBe('object')
	})

	it('Dungeon.build() should return a Results instance', () => {
		expect(dungeon().build()).toBeInstanceOf(Results)
	})
})
