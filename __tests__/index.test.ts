import {walkDungeon} from './helpers'
import {dungeon} from '../src'
import Tile from '../src/Tile'

it('.build() should return an object containing the key "tiles"', () => {
	const $dungeon = dungeon().build({
		width: 21,
		height: 21
	})

	expect($dungeon.tiles).toBeTruthy()
})

it('.build() should return an object containing the key "rooms"', () => {
	const $dungeon = dungeon().build({
		width: 21,
		height: 21
	})

	expect($dungeon.rooms).toBeTruthy()
})

it('.build() should return a 2d array of tiles proportional to the width and height options', () => {
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

it('.build() every tile should correctly reference its neighbors', () => {
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

it('.build() tiles on the north edge should not list a northern neighbour', () => {
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

it('.build() tiles on the east edge should not list an eastern neighbour', () => {
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

it('.build() tiles on the south edge should not list a southern neighbour', () => {
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

it('.build() tiles on the west edge should not list a western neighbour', () => {
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

it('.build() the tile on north west corner should have only three neighbors', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height
	})

	const tile = $dungeon.tiles[0][0]

	expect(Object.keys(tile.neighbors)).toEqual(['e', 'se', 's'])
})

it('.build() the tile on north east corner should have only three neighbors', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height
	})

	const tile = $dungeon.tiles[width - 1][0]

	expect(Object.keys(tile.neighbors)).toEqual(['s', 'sw', 'w'])
})

it('.build() the tile on south west corner should have only three neighbors', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height
	})

	const tile = $dungeon.tiles[0][height - 1]

	expect(Object.keys(tile.neighbors)).toEqual(['n', 'ne', 'e'])
})

it('.build() the tile on south east corner should have only three neighbors', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height
	})

	const tile = $dungeon.tiles[width - 1][height - 1]

	expect(Object.keys(tile.neighbors)).toEqual(['n', 'w', 'nw'])
})

it('.build() tiles should contain at least one floor tile', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height
	})

	const floorTiles = []

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const tile = $dungeon.tiles[x][y]
			if (tile.type === 'floor') {
				floorTiles.push(tile)
			}
		}
	}

	expect(floorTiles.length).toBeTruthy()
})

it('.build() every floor tile should be connected to a floor or door tile', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height
	})

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const tile = $dungeon.tiles[x][y]
			if (tile.type === 'floor') {
				const neighbors = $dungeon.tiles[x][y].neighbors

				expect(Object.values(neighbors).find((n: Tile) => {
					return n.type === 'floor' || n.type === 'door'
				})).toBeTruthy()
			}
		}
	}
})

it('.build() every door tile should be connected to at least two floor tiles', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height
	})

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const tile = $dungeon.tiles[x][y]
			if (tile.type === 'door') {
				const neighbors = $dungeon.tiles[x][y].neighbors

				expect(Object.values(neighbors).filter((n: Tile) => {
					return n.type === 'floor'
				}).length >= 2).toBeTruthy()
			}
		}
	}
})

it('.build() every floor and door tile should be accessible', () => {
	expect(() => {
		const width = 15
		const height = 15
		const $dungeon = dungeon().build({
			width,
			height
		})

		const visited = walkDungeon($dungeon)

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				const tile = $dungeon.tiles[x][y]
				if (tile.type === 'door' || tile.type === 'floor') {
					if (!visited[tile.x][tile.y]) {
						throw new Error(`Tile ${x}, ${y} was not visited`)
					}
				}
			}
		}
	}).not.toThrow()
})

it('.build() even numbers for options.width and options.height should be rounded up', () => {
	const width = 20
	const height = 20
	const $dungeon = dungeon().build({
		width,
		height
	})

	expect($dungeon.tiles.length).toBe(width + 1)
	expect($dungeon.tiles[0].length).toBe(height + 1)
})

it('.build() should throw an error if width is less than 5', () => {
	const width = 4
	const height = 20

	expect(() => {
		dungeon().build({
			width,
			height
		})
	}).toThrow(`DungeonError: options.width must not be less than 5, received ${width}`)
})

it('.build() should throw an error if height is less than 5', () => {
	const width = 20
	const height = 4

	expect(() => {
		dungeon().build({
			width,
			height
		})
	}).toThrow(`DungeonError: options.height must not be less than 5, received ${height}`)
})

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

it('.build() should return a re-usable seed', () => {
	const width = 21
	const height = 21
	const dungeon1 = dungeon().build({
		width,
		height
	})

	const dungeon2 = dungeon().build({
		width,
		height,
		seed: dungeon1.seed
	})

	expect(dungeon1.toJson()).toEqual(dungeon2.toJson())
})

it('.build() seeded dungeons should be consistent', () => {
	const width = 21
	const height = 21
	const $dungeon = dungeon().build({
		width,
		height,
		seed: 'snickbit'
	})
	expect($dungeon.toJson()).toMatchSnapshot()
})

it('.build() should be seedable', () => {
	const width = 21
	const height = 21
	const dungeon1 = dungeon().build({
		width,
		height,
		seed: 'snickbit'
	})

	const dungeon2 = dungeon().build({
		width,
		height,
		seed: 'snickbit'
	})

	expect(dungeon1.toJson()).toEqual(dungeon2.toJson())
})

const sizes = [
	[5, 7],
	[7, 7],
	[21, 21],
	[51, 51],
	[101, 101]
]

for (const [width, height] of sizes) {
	it(`.build() Should reliably create ${width} x ${height} dungeons`, () => {
		expect(() => {
			let count = 10

			while (count--) {
				dungeon().build({
					width,
					height
				})
			}
		}).not.toThrow()
	})
}
