import {dungeon, Tile} from '../../src'
import {$chance} from '../../src/random/chance'

const RELIABILITY_COUNT = 10

const counter = Array.from(Array(RELIABILITY_COUNT).keys())

describe('dungeon.build()', () => {
	it('should return an object containing the key "tiles"', async () => {
		const $dungeon = await dungeon().build({
			width: 21,
			height: 21
		})

		expect($dungeon.tiles).toBeTruthy()
	})

	it('should return an object containing the key "rooms"', async () => {
		const $dungeon = await dungeon().build({
			width: 21,
			height: 21
		})

		expect($dungeon.rooms).toBeTruthy()
	})

	it('should return a 2d array of tiles proportional to the width and height options', async () => {
		const width = 21
		const height = 31

		const $dungeon = await dungeon().build({
			width,
			height
		})

		expect($dungeon.tiles.length).toBe(width)

		for (const column of $dungeon.tiles) {
			expect(column.length).toBe(height)
		}
	})

	it('even numbers for options.width and options.height should be rounded up', async () => {
		const width = 20
		const height = 20
		const $dungeon = await dungeon().build({
			width,
			height
		})

		expect($dungeon.tiles.length).toBe(width + 1)
		expect($dungeon.tiles[0].length).toBe(height + 1)
	})

	it('should throw an error if width is less than 5', () => {
		const width = 4
		const height = 20

		return expect(dungeon().build({
			width,
			height
		})).rejects.toThrow(`DungeonError: options.width must not be less than 5, received ${width}`)
	})

	it('should throw an error if height is less than 5', () => {
		const width = 20
		const height = 4

		return expect(dungeon().build({
			width,
			height
		})).rejects.toThrow(`DungeonError: options.height must not be less than 5, received ${height}`)
	})

	describe('reliability', () => {
		const sizes = [
			[5, 7],
			[7, 7],
			[21, 21],
			[51, 51],
			[101, 101]
		]

		let seed = $chance.generateSlug()

		describe.each(counter)(`Should reliably generate random dungeons (seed: ${seed}-%i)`, (i: number) => {
			describe.each(sizes)('Should reliably create %i x %i dungeons', (width: number, height: number) => {
				const $gen = dungeon()
				const options = {
					width,
					height,
					seed: `${seed}-${i}`
				}

				it('should generate a random dungeon', () => {
					expect(() => {
						$gen.build(options)
					}).not.toThrow()
				})

				it('tiles should contain at least one floor tile', async () => {
					const $dungeon = await $gen.build(options)

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

				it('every floor tile should be connected to a floor or door tile', async () => {
					const $dungeon = await $gen.build(options)

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

				it('every door tile should be connected to at least two floor tiles', async () => {
					const $dungeon = await $gen.build(options)

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

				it('every floor and door tile should be accessible', async () => {
					const $dungeon = await $gen.build(options)

					expect(() => {
						const visited = walkDungeon($dungeon)

						for (let x = 0; x < width; x++) {
							for (let y = 0; y < height; y++) {
								const tile = $dungeon.tiles[x][y]
								if (tile.type === 'door' || tile.type === 'floor') {
									if (!visited[tile.x][tile.y]) {
										throw new Error(`Tile ${x}, ${y} was not visited for dungeon of size ${width}x${height} : ${$dungeon.seed}`)
									}
								}
							}
						}

						return true
					}).not.toThrow()
				})
			}, 3000)
		}, 3000)
	})
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
