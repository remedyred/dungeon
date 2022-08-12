import {createBuilder, DungeonBuilder, Results} from '../../src'

describe('DungeonBuilder', () => {
	it('createBuilder should be a function', () => {
		expect(typeof createBuilder).toBe('function')
	})

	it('createBuilder should return an object', () => {
		expect(typeof createBuilder()).toBe('object')
	})

	it('DungeonBuilder should be constructable', () => {
		expect(new DungeonBuilder()).toBeTruthy()
	})

	it('DungeonBuilder should have a .build() method', () => {
		expect(typeof createBuilder().build).toBe('function')
	})

	it('DungeonBuilder.build() should return an object', () => {
		expect(typeof createBuilder().build()).toBe('object')
	})

	it('DungeonBuilder.build() should return a DungeonBuilder instance', () => {
		expect(createBuilder().build()).resolves.toBeInstanceOf(DungeonBuilder)
	})

	it('DungeonBuilder.build().toJSON() should return a Results instance', async () => {
		expect((await createBuilder().build()).toJSON()).toBeInstanceOf(Results)
	})
})
