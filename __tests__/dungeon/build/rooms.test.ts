import {createBuilder} from '../../../src'
import {$chance} from '../../../src/random/chance'

const options = {
	width: 21,
	height: 21,
	seed: $chance.generateSlug()
}

const $builder = createBuilder()

describe(`rooms ${options.seed}`, () => {
	it('every room should have numerical height, width, x, and y properties', async () => {
		await $builder.build(options)

		for (const room of $builder.rooms) {
			expect(typeof room.height).toBe('number')
			expect(typeof room.width).toBe('number')
			expect(typeof room.x).toBe('number')
			expect(typeof room.y).toBe('number')
		}
	})

	it('every room should fall within the bounds of the declared height and width', async () => {
		await $builder.build(options)

		for (const room of $builder.rooms) {
			expect(room.width + room.x <= options.width).toBeTruthy()
			expect(room.height + room.y <= options.height).toBeTruthy()
		}
	})

	it('every room should be surrounded by either wall or door tiles', async () => {
		await $builder.build(options)

		const tiles = []

		for (const room of $builder.rooms) {
			const points = room.getBorderPoints(0, false)
			for (const point of points) {
				if ($builder.hasTile(point)) {
					tiles.push($builder.getTile(point))
				}
			}
		}

		for (const tile of tiles) {
			if (tile.type !== 'wall' && tile.type !== 'door') {
				throw new Error(`${tile.type} should not border a room! Tile: ${tile.x}x${tile.y}`)
			}
			expect(['wall', 'door']).toContain(tile.type)
		}
	})

	it('every room should have at least one adjacent door tile', async () => {
		await $builder.build(options)

		for (const room of $builder.rooms) {
			const tiles = []

			const points = room.getBorderPoints(0, false)
			for (const point of points) {
				if ($builder.hasTile(point)) {
					tiles.push($builder.getTile(point))
				}
			}

			const doors = tiles.filter(tile => tile.type === 'door')

			if (doors.length === 0) {
				throw new Error(`Room ${room.x}x${room.y} has no doors! ${tiles.map(tile => `${tile.x}x${tile.y}`).join(', ')}`)
			}

			expect(doors.length).toBeGreaterThan(0)
		}
	})

	it('every room should be made up of an area of floor tiles', async () => {
		await $builder.build(options)

		expect(() => {
			for (const room of $builder.rooms) {
				for (let x = room.x; x < room.x + room.width; x++) {
					for (let y = room.y; y < room.y + room.height; y++) {
						const tile = $builder.tiles[x][y]
						expect(tile.type).toBe('floor')
					}
				}
			}
		}).not.toThrow()
	})
})
