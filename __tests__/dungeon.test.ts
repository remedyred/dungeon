import {dungeon, Tile} from '../src'

describe('dungeon', () => {
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
})

function walkDungeon(dungeon) {
	let start
	const visited = []

	for (let x = 0; x < dungeon.tiles.length; x++) {
		if (!visited[x]) {
			visited[x] = []
		}

		for (let y = 0; y < dungeon.tiles[x].length; y++) {
			visited[x].push(false)

			if (!start && match(dungeon.tiles[x][y])) {
				start = dungeon.tiles[x][y]
			}
		}
	}

	const stack = [start]

	while (stack.length) {
		const tile = stack.shift()

		visit(tile)

		for (const dir in tile.neighbors) {
			const neighbour = tile.neighbors[dir]
			if (!visited[neighbour.x][neighbour.y] && match(neighbour)) {
				stack.push(neighbour)
			}
		}
	}

	function match(tile) {
		return tile.type === 'floor' || tile.type === 'door'
	}

	function visit(tile) {
		visited[tile.x][tile.y] = true
	}

	return visited
}
