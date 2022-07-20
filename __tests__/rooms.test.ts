import {dungeon} from '../src'

describe('rooms', () => {
	it('.build() every room should have numerical height, width, x, and y properties', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
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

	it('.build() every room should fall within the bounds of the declared height and width', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		for (const room of $dungeon.rooms) {
			expect(room.width + room.x <= width).toBeTruthy()
			expect(room.height + room.y <= height).toBeTruthy()
		}
	})

	it('.build() every room should be surrounded by either wall or door tiles', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
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
			expect(tile.type === 'wall' || tile.type === 'door').toBeTruthy()
		}
	})

	it('.build() every room should have at least one adjacent door tile', () => {
		const width = 21
		const height = 21
		const $dungeon = dungeon().build({
			width,
			height
		})

		for (const room of $dungeon.rooms) {
			const tiles = []

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

			expect(tiles.find(tile => {
				return tile.type === 'door'
			})).toBeTruthy()
		}
	})

	it('.build() every room should be made up of an area of floor tiles', () => {
		expect(() => {
			const width = 21
			const height = 21
			const $dungeon = dungeon().build({
				width,
				height
			})

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
