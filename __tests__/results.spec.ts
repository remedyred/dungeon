import {dungeon} from '../src'

describe('Results', () => {
	it('Dungeon.build() should return an object containing the key "tiles"', () => {
		const $dungeon = dungeon().build({
			width: 21,
			height: 21
		})

		expect($dungeon.tiles).toBeTruthy()
	})

	it('Dungeon.build() should return an object containing the key "rooms"', () => {
		const $dungeon = dungeon().build({
			width: 21,
			height: 21
		})

		expect($dungeon.rooms).toBeTruthy()
	})

	it('Dungeon.build() should return a 2d array of tiles proportional to the width and height options', () => {
		const width = 21
		const height = 31

		const $dungeon = dungeon().build({
			width,
			height
		})

		expect($dungeon.tiles.length).toBe(width)

		for (const column of $dungeon.tiles) {
			expect(column.length).toBe(height)
		}
	})
})
