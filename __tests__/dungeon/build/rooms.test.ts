import {dungeon} from '../../../src'

describe('rooms', () => {
	it('every room should have numerical height, width, x, and y properties', async () => {
		const width = 21
		const height = 21
		const $dungeon = await dungeon().build({
			width,
			height
		})

		for (const room of $dungeon.rooms) {
			expect(typeof room.height).toBe('number')
			expect(typeof room.width).toBe('number')
			expect(typeof room.x).toBe('number')
			expect(typeof room.y).toBe('number')
		}
	})

	it('every room should fall within the bounds of the declared height and width', async () => {
		const width = 21
		const height = 21
		const $dungeon = await dungeon().build({
			width,
			height
		})

		for (const room of $dungeon.rooms) {
			expect(room.width + room.x <= width).toBeTruthy()
			expect(room.height + room.y <= height).toBeTruthy()
		}
	})

	it('every room should be surrounded by either wall or door tiles', async () => {
		const width = 21
		const height = 21
		const $dungeon = await dungeon().build({
			width,
			height
		})

		const tiles = []

		for (const room of $dungeon.rooms) {
			const north = room.y - 1
			const east = room.x + room.width
			const south = room.y + room.height
			const west = room.x - 1

			for (let x = west; x < east + 1; x++) {
				if ($dungeon.tiles[x]) {
					if ($dungeon.tiles[x][north]) {
						tiles.push($dungeon.tiles[x][north])
					}

					if ($dungeon.tiles[x][south]) {
						tiles.push($dungeon.tiles[x][south])
					}
				}
			}

			for (let y = north + 1; y < south; y++) {
				if ($dungeon.tiles[west]) {
					tiles.push($dungeon.tiles[west][y])
				}

				if ($dungeon.tiles[east]) {
					tiles.push($dungeon.tiles[east][y])
				}
			}
		}

		for (const tile of tiles) {
			expect(['wall', 'door']).toContain(tile.type)
		}
	})

	it('every room should have at least one adjacent door tile', async () => {
		const width = 21
		const height = 21
		const $dungeon = await dungeon().build({
			width,
			height
		})

		for (const room of $dungeon.rooms) {
			const tiles = []

			const points = room.getBorderPoints(1)
			for (const point of points) {
				if (dungeon().hasTile(point)) {
					tiles.push(dungeon().getTile(point))
				}
			}

			const north = room.y - 1
			const east = room.x + room.width
			const south = room.y + room.height
			const west = room.x - 1

			for (let x = west; x < east + 1; x++) {
				if ($dungeon.tiles[x]) {
					if ($dungeon.tiles[x][north]) {
						tiles.push($dungeon.tiles[x][north])
					}

					if ($dungeon.tiles[x][south]) {
						tiles.push($dungeon.tiles[x][south])
					}
				}
			}

			for (let y = north + 1; y < south; y++) {
				if ($dungeon.tiles[west]) {
					tiles.push($dungeon.tiles[west][y])
				}

				if ($dungeon.tiles[east]) {
					tiles.push($dungeon.tiles[east][y])
				}
			}

			expect(tiles.find(tile => tile.isDoor())).toBeTruthy()
		}
	})

	it('every room should be made up of an area of floor tiles', async () => {
		const width = 21
		const height = 21
		const $dungeon = await dungeon().build({
			width,
			height
		})

		expect(() => {
			for (const room of $dungeon.rooms) {
				for (let x = room.x; x < room.x + room.width; x++) {
					for (let y = room.y; y < room.y + room.height; y++) {
						const tile = $dungeon.tiles[x][y]
						expect(tile.type).toBe('floor')
					}
				}
			}
		}).not.toThrow()
	})
})
