import {createBuilder} from '../../../src'

const $builder = createBuilder()

describe('neighbors', () => {
	it('every tile should correctly reference its neighbors', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		expect(() => {
			for (let x = 0; x < width; x++) {
				for (let y = 0; y < height; y++) {
					const neighbors = $builder.tiles[x][y].neighbors

					if (neighbors.n) {
						expect(neighbors.n).toBe($builder.tiles[x][y - 1])
					}

					if (neighbors.ne) {
						expect(neighbors.ne).toBe($builder.tiles[x + 1][y - 1])
					}

					if (neighbors.e) {
						expect(neighbors.e).toBe($builder.tiles[x + 1][y])
					}

					if (neighbors.se) {
						expect(neighbors.se).toBe($builder.tiles[x + 1][y + 1])
					}

					if (neighbors.s) {
						expect(neighbors.s).toBe($builder.tiles[x][y + 1])
					}

					if (neighbors.sw) {
						expect(neighbors.sw).toBe($builder.tiles[x - 1][y + 1])
					}

					if (neighbors.w) {
						expect(neighbors.w).toBe($builder.tiles[x - 1][y])
					}

					if (neighbors.nw) {
						expect(neighbors.nw).toBe($builder.tiles[x - 1][y - 1])
					}
				}
			}
		}).not.toThrow()
	})

	it('tiles on the north edge should not list a northern neighbour', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		for (let x = 0; x < width; x++) {
			const tile = $builder.tiles[x][0]

			expect(tile.neighbors.n).toBeFalsy()
		}
	})

	it('tiles on the east edge should not list an eastern neighbour', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		for (let y = 0; y < height; y++) {
			const tile = $builder.tiles[width - 1][y]

			expect(tile.neighbors.e).toBeFalsy()
		}
	})

	it('tiles on the south edge should not list a southern neighbour', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		for (let x = 0; x < width; x++) {
			const tile = $builder.tiles[x][height - 1]

			expect(tile.neighbors.s).toBeFalsy()
		}
	})

	it('tiles on the west edge should not list a western neighbour', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		for (let y = 0; y < height; y++) {
			const tile = $builder.tiles[0][y]

			expect(tile.neighbors.w).toBeFalsy()
		}
	})

	it('the tile on north west corner should have only three neighbors', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		const tile = $builder.tiles[0][0]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['e', 'se', 's'])
	})

	it('the tile on north east corner should have only three neighbors', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		const tile = $builder.tiles[width - 1][0]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['s', 'sw', 'w'])
	})

	it('the tile on south west corner should have only three neighbors', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		const tile = $builder.tiles[0][height - 1]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['n', 'ne', 'e'])
	})

	it('the tile on south east corner should have only three neighbors', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		const tile = $builder.tiles[width - 1][height - 1]

		expect(Object.keys(tile.neighbors)).toStrictEqual(['n', 'w', 'nw'])
	})
})
