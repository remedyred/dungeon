import {arrayUnique, isDefined, objectFilter} from '@snickbit/utilities'
import {Results} from './Results'
import {cardinalDirections, Coordinates, parsePoint, Point, PointArray} from './Coordinates'
import {isBrowser} from 'browser-or-node'
import {$chance} from './common'
import Tile, {TileType} from './Tile'
import Chance from 'chance'
import Room from './Room'

export interface DungeonOptions {
	doorChance?: number
	maxDoors?: number
	roomTries?: number
	roomExtraSize?: number
	windingPercent?: number
	multiplier?: number
	width?: number
	height?: number
}

export interface StageOptions {
	width: number
	height: number
	seed?: any
}

const defaultDungeonOptions: DungeonOptions = {
	doorChance: 50,
	maxDoors: 5,
	roomTries: 50,
	roomExtraSize: 0,
	windingPercent: 50
}

const defaultStageOptions: StageOptions = {
	width: 5,
	height: 5
}

export type TileMatrix = Tile[][]

export interface Neighbors {
	n?: Tile
	ne?: Tile
	e?: Tile
	se?: Tile
	s?: Tile
	sw?: Tile
	w?: Tile
	nw?: Tile
}

export class Dungeon {
	options: DungeonOptions
	stage: StageOptions
	rng: Chance.Chance

	private rooms = []
	private currentRegion = -1
	private tiles: TileMatrix = []
	private seed: any

	constructor(options?: DungeonOptions) {
		this.options = {...defaultDungeonOptions, ...options}
		this.options.multiplier = this.options.multiplier > 0 ? parseInt(String(this.options.multiplier || 1)) || 1 : 1
	}

	randBetween(min: number, max: number): number {
		return this.rng.integer({min, max})
	}

	getTile(x: number, y: number): Tile {
		return this.tiles[x][y]
	}

	setTile(x: number, y: number, type: TileType): Tile {
		if (this.tiles[x] && this.tiles[x][y]) {
			const tile = this.tiles[x][y]
			tile.type = type
			tile.region = this.currentRegion
			return tile
		}

		throw new RangeError(`tile at ${x}, ${y} is unreachable`)
	}

	fill(type: TileType): TileMatrix {
		let neighbors: Neighbors = {}
		let x
		let y

		for (x = 0; x < this.stage.width; x++) {
			this.tiles.push([])
			for (y = 0; y < this.stage.height; y++) {
				this.tiles[x].push(new Tile(type, x, y))
			}
		}

		for (x = 0; x < this.stage.width; x++) {
			for (y = 0; y < this.stage.height; y++) {
				neighbors = {}
				if (this.tiles[x][y - 1]) {
					neighbors.n = this.tiles[x][y - 1]
				}
				if (this.tiles[x + 1] && this.tiles[x + 1][y - 1]) {
					neighbors.ne = this.tiles[x + 1][y - 1]
				}
				if (this.tiles[x + 1] && this.tiles[x + 1][y]) {
					neighbors.e = this.tiles[x + 1][y]
				}
				if (this.tiles[x + 1] && this.tiles[x + 1][y + 1]) {
					neighbors.se = this.tiles[x + 1][y + 1]
				}
				if (this.tiles[x] && this.tiles[x][y + 1]) {
					neighbors.s = this.tiles[x][y + 1]
				}
				if (this.tiles[x - 1] && this.tiles[x - 1][y + 1]) {
					neighbors.sw = this.tiles[x - 1][y + 1]
				}
				if (this.tiles[x - 1] && this.tiles[x - 1][y]) {
					neighbors.w = this.tiles[x - 1][y]
				}
				if (this.tiles[x - 1] && this.tiles[x - 1][y - 1]) {
					neighbors.nw = this.tiles[x - 1][y - 1]
				}
				this.tiles[x][y].setNeighbors(neighbors)
			}
		}

		return this.tiles
	}

	private validate(stage: StageOptions): void {
		if (stage.width < 5) {
			throw new RangeError(`DungeonError: options.width must not be less than 5, received ${stage.width}`)
		}

		if (stage.height < 5) {
			throw new RangeError(`DungeonError: options.height must not be less than 5, received ${stage.height}`)
		}

		if (stage.width % 2 === 0) {
			stage.width += 1
		}

		if (stage.height % 2 === 0) {
			stage.height += 1
		}

		stage.width *= this.options.multiplier
		stage.height *= this.options.multiplier

		const seed: string = stage.seed || $chance.generateSlug()

		this.rng = new Chance(seed)

		this.seed = seed

		this.stage = stage
	}

	build(stage?: StageOptions): Results {
		stage = {...defaultStageOptions, ...stage}

		// validate the state options
		this.validate(stage)

		// fill the entire area with solid 'wall' tiles
		this.fill('wall')

		// create the rooms
		this.addRooms()

		// Fill in all the empty space with mazes.
		for (let y = 1; y < stage.height; y += 2) {
			for (let x = 1; x < stage.width; x += 2) {
				// Skip the maze generation if the tile is already carved
				if (this.getTile(x, y).type === 'floor') {
					continue
				}
				this.growMaze(x, y)
			}
		}

		// create doors between rooms and corridors
		this.connectRegions()

		// remove dead ends
		this.removeDeadEnds()

		return new Results(this.rooms, this.tiles, this.seed)
	}

	carveArea(x: number, y: number, width: number, height: number): void {
		for (let i = x; i < x + width; i++) {
			for (let j = y; j < y + height; j++) {
				this.carve(i, j)
			}
		}
	}

	private growMaze(startX: number, startY: number): void {
		const cells: Point[] = []
		let lastDirection

		if (objectFilter(this.tiles[startX][startY].neighbors, (key: string, tile: Tile) => tile.type === 'floor').length > 0) {
			return
		}

		this.startRegion()

		this.carve(startX, startY)

		cells.push({
			x: startX,
			y: startY
		})

		let count = 0

		while (cells.length && count < 500) {
			count++
			const cell = cells[cells.length - 1]

			// See which adjacent cells are open.
			const unmadeCells: PointArray[] = []

			for (const direction of cardinalDirections) {
				if (this.canCarve(cell, direction)) {
					unmadeCells.push(direction)
				}
			}

			if (unmadeCells.length) {
				// Based on how "windy" passages are, try to prefer carving in the
				// same direction.
				let direction: Point
				const cellIds = unmadeCells.map(v => v.toString())
				if (lastDirection && cellIds.indexOf(lastDirection.toString()) > -1 && this.randBetween(1, 100) > this.options.windingPercent) {
					direction = parsePoint(lastDirection)
				} else {
					const rand = this.randBetween(0, unmadeCells.length - 1)
					direction = parsePoint(unmadeCells[rand])
				}

				// carve the first cell in the direction
				this.carve(cell.x + direction.x, cell.y + direction.y)

				// create the new cell
				const newCell = {
					x: cell.x + direction.x * 2,
					y: cell.y + direction.y * 2
				}

				// carve the space where the new cell will be
				this.carve(newCell.x, newCell.y)

				// place the new cell in the stack
				cells.push(newCell)

				lastDirection = {...direction}
			} else {
				// No adjacent uncarved cells.
				cells.pop()

				// This path has ended.
				lastDirection = null
			}
		}
	}

	private addRooms(): void {
		const roomRestrictionModifier = 4 * this.options.multiplier

		for (let i = 0; i < this.options.roomTries; i++) {
			// Pick a random room size. The funny math here does two things:
			// - It makes sure rooms are odd-sized to line up with maze.
			// - It avoids creating rooms that are too rectangular: too tall and
			//   narrow or too wide and flat.
			const size = this.randBetween(1, 3 + this.options.roomExtraSize) * 2 + 1
			const rectangularity = this.randBetween(0, 1 + Math.floor(size / 2)) * 2
			let width = size
			let height = size
			if (this.oneIn(2)) {
				width += rectangularity
			} else {
				height += rectangularity
			}

			// Restrict the size of rooms relative to the stage size
			width = Math.min(width, this.stage.width - roomRestrictionModifier)
			height = Math.min(width, this.stage.height - roomRestrictionModifier)

			let x = this.randBetween(0, Math.floor((this.stage.width - width) / 2)) * 2 + 1
			let y = this.randBetween(0, Math.floor((this.stage.height - height) / 2)) * 2 + 1

			// Make sure X dimension doesn't overflow
			if (x + width > this.stage.width) {
				x = Math.max(1, this.stage.width - width - 1)
			}

			// Make sure Y dimension doesn't overflow
			if (y + height > this.stage.height) {
				y = Math.max(1, this.stage.height - height - 1)
			}

			const room = new Room(x, y, width, height)

			let overlaps = false

			for (const other of this.rooms) {
				if (room.intersects(other)) {
					overlaps = true
					break
				}
			}

			if (overlaps) {
				continue
			}

			this.rooms.push(room)

			this.startRegion()

			// Convert room tiles to floor
			this.carveArea(x, y, width, height)
		}
	}

	private connectRegions(): void {
		const regionConnections: Record<string, Tile[]> = {}
		for (const row of this.tiles) {
			for (const tile of row) {
				if (tile.type === 'floor') {
					continue
				}

				const tileRegions = arrayUnique(tile.cardinal().map(neighbor => neighbor.region).filter(neighborRegion => isDefined(neighborRegion)))
				if (tileRegions.length <= 1) {
					continue
				}

				const key = tileRegions.join('-')
				if (!regionConnections[key]) {
					regionConnections[key] = []
				}
				regionConnections[key].push(tile)
			}
		}

		let added_connections = 0
		for (const connections of Object.values(regionConnections)) {
			const index = this.randBetween(0, connections.length - 1)
			const connection = connections[index]

			if (connection.isCorner() || connection.nearDoors()) {
				continue
			}

			connection.type = 'door'
			connections.splice(index, 1)
			added_connections++

			// Occasionally open up additional connections
			for (const conn of connections) {
				if (added_connections <= this.options.maxDoors) {
					if (
						!conn.isCorner() &&
						!conn.nearDoors() &&
						!conn.isAtEnd() &&
						this.oneIn(this.options.doorChance)
					) {
						conn.type = 'door'
						added_connections++
					}
				} else {
					break
				}
			}
		}
	}

	private oneIn(num: number): boolean {
		return this.randBetween(1, num) === 1
	}

	private removeDeadEnds(): void {
		let done = false

		const cycle = () => {
			let done = true
			for (const row of this.tiles) {
				for (const tile of row) {
					// If it only has one exit, it's a dead end --> fill it in!
					if (tile.type === 'wall') {
						continue
					}
					if (
						tile.find().cardinal().notType('wall').get().length <= 1 &&
						!this.rooms.find(room => room.containsTile(tile.x, tile.y))
					) {
						tile.type = 'wall'
						done = false
					}
				}
			}

			return done
		}

		while (!done) {
			done = true
			done = cycle()
		}
	}

	private canCarve(cell: Point, offset: Coordinates): boolean {
		const parsed = parsePoint(offset)

		// Must end in bounds.
		const end: Point = {
			x: cell.x + parsed.x * 3,
			y: cell.y + parsed.y * 3
		}

		if (!this.tiles[end.x] || !this.tiles[end.x][end.y]) {
			return false
		}

		if (this.getTile(end.x, end.y).type !== 'wall') {
			return false
		}

		// Destination must not be open.
		const dest: Point = {
			x: cell.x + parsed.x * 2,
			y: cell.y + parsed.y * 2
		}
		return this.getTile(dest.x, dest.y).type !== 'floor'
	}

	private startRegion() {
		this.currentRegion++
		return this.currentRegion
	}

	private carve(x: number, y: number, type: TileType = 'floor') {
		this.setTile(x, y, type)
	}
}

export function dungeon(options?: DungeonOptions): Dungeon {
	return new Dungeon(options)
}

if (isBrowser) {
	window.dungeon = dungeon
}

