import {dungeon} from '../../../src'

describe('neighbors', () => {
	it('every tile should correctly reference its neighbors', () => {
		expect(() => {
			const width = 21
			const height = 21
			const $dungeon = dungeon().build({
				width,
				height
			})

			for (let x = 0; x < width; x++) {
				for (let y = 0; y < height; y++) {
					const neighbors = $dungeon.tiles[x][y].neighbors

					if (neighbors.n) {
						expect(neighbors.n).toBe($dungeon.tiles[x][y - 1])
					}

					if (neighbors.ne) {
						expect(neighbors.ne).toBe($dungeon.tiles[x + 1][y - 1])
					}

					if (neighbors.e) {
						expect(neighbors.e).toBe($dungeon.tiles[x + 1][y])
					}

					if (neighbors.se) {
						expect(neighbors.se).toBe($dungeon.tiles[x + 1][y + 1])
					}

					if (neighbors.s) {
						expect(neighbors.s).toBe($dungeon.tiles[x][y + 1])
					}

					if (neighbors.sw) {
						expect(neighbors.sw).toBe($dungeon.tiles[x - 1][y + 1])
					}

					if (neighbors.w) {
						expect(neighbors.w).toBe($dungeon.tiles[x - 1][y])
					}

					if (neighbors.nw) {
						expect(neighbors.nw).toBe($dungeon.tiles[x - 1][y - 1])
					}
				}
			}
		}).not.toThrow()
	})

	it('tiles on the north edge should not list a northern neighbour', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		for (let x = 0; x < width; x++) {
			const tile = $dungeon.tiles[x][0]

			expect(tile.neighbors.n).toBeFalsy()
		}
	})

	it('tiles on the east edge should not list an eastern neighbour', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		for (let y = 0; y < height; y++) {
			const tile = $dungeon.tiles[width - 1][y]

			expect(tile.neighbors.e).toBeFalsy()
		}
	})

	it('tiles on the south edge should not list a southern neighbour', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		for (let x = 0; x < width; x++) {
			const tile = $dungeon.tiles[x][height - 1]

			expect(tile.neighbors.s).toBeFalsy()
		}
	})

	it('tiles on the west edge should not list a western neighbour', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		for (let y = 0; y < height; y++) {
			const tile = $dungeon.tiles[0][y]

			expect(tile.neighbors.w).toBeFalsy()
		}
	})

	it('the tile on north west corner should have only three neighbors', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		const tile = $dungeon.tiles[0][0]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['e', 'se', 's'])
	})

	it('the tile on north east corner should have only three neighbors', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		const tile = $dungeon.tiles[width - 1][0]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['s', 'sw', 'w'])
	})

	it('the tile on south west corner should have only three neighbors', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		const tile = $dungeon.tiles[0][height - 1]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['n', 'ne', 'e'])
	})

	it('the tile on south east corner should have only three neighbors', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		const tile = $dungeon.tiles[width - 1][height - 1]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['n', 'w', 'nw'])
	})
})
