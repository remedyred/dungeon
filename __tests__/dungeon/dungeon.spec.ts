import {createBuilder, DungeonBuilder, Results} from '../../src'

const $builder = createBuilder()

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
		expect(typeof $builder.build).toBe('function')
	})

	it('DungeonBuilder.build() should return an object', () => {
		expect(typeof $builder.build()).toBe('object')
	})

	it('DungeonBuilder.build() should return a DungeonBuilder instance', () => {
		expect($builder.build()).resolves.toBeInstanceOf(DungeonBuilder)
	})

	it('DungeonBuilder.build().toJSON() should return a Results instance', async () => {
		expect((await $builder.build()).toJSON()).toBeInstanceOf(Results)
	})
})
