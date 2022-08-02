import {createBuilder} from '../src'

const $builder = createBuilder()

describe('Results', () => {
	it('DungeonBuilder.build() should return an object containing the key "tiles"', async () => {
		await $builder.build({
			width: 21,
			height: 21
		})

		expect($builder.tiles).toBeTruthy()
	})

	it('DungeonBuilder.build() should return an object containing the key "rooms"', async () => {
		await $builder.build({
			width: 21,
			height: 21
		})

		expect($builder.rooms).toBeTruthy()
	})

	it('DungeonBuilder.build() should return a 2d array of tiles proportional to the width and height options', async () => {
		const width = 21
		const height = 31

		await $builder.build({
			width,
			height
		})

		expect($builder.tiles.length).toBe(width)

		for (const column of $builder.tiles) {
			expect(column.length).toBe(height)
		}
	})
})
