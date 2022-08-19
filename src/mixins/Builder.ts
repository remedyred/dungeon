import {DungeonState, safeMerge, State} from './State'
import {$out, DungeonOptions} from '../common'
import {Region} from '../structures/Region'
import {Results} from '../Results'
import {Random} from './Random'
import {RegionManager} from './RegionManager'
import {RoomManager} from './RoomManager'
import {CorridorManager} from './CorridorManager'
import {Walker} from './Walker'
import {Corridor} from '../structures/Corridor'
import {Carver} from './Carver'
import {objectCopy} from '@snickbit/utilities'
import {Maze} from './Maze'
import Tile, {Neighbors, TileMatrix, TileType} from '../structures/Tile'
import Room from '../structures/Room'
import Chance from 'chance'

export type StageOptions = Pick<DungeonOptions, 'height' | 'seed' | 'width'>

export interface BuilderState {
	stage: StageOptions
	results?: Results
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Builder extends State, Random, RegionManager, RoomManager, CorridorManager, Walker, Carver, Maze {
}

const default_stage: StageOptions = {
	width: 10,
	height: 10
}

const default_state: BuilderState = {stage: {...default_stage}}

export class Builder {
	init() {
		this.state = safeMerge<DungeonState>(this.state, default_state)
	}

	toJSON(): Results {
		return new Results(this.rooms, this.tiles, this.seed)
	}

	protected validate(stage: StageOptions): void {
		stage = safeMerge<StageOptions>(stage, default_stage)

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

		this.seed = stage.seed
		this.rng = new Chance(this.seed)

		this.state.stage = stage
	}

	// noinspection JSMethodCanBeStatic
	protected connectDoor(tile: Tile, options?: {region?: number; name?: number | string}): void {
		if (options.region) {
			tile.region = options.region
		}
		if (options.name) {
			tile.name = String(options.name)
		}
		tile.type = 'door'
	}

	protected connectCorridors(a: number | string, b: number | string, connection: Tile): void {
		const corridors = this.getCorridors()
		const corridorA = corridors.find(c => c.isRegion(a))
		if (!corridorA) {
			throw new Error(`Could not find corridor with region ${a}`)
		}
		const corridorB = corridors.find(c => c.isRegion(b))
		if (!corridorB) {
			throw new Error(`Could not find corridor with region ${b}`)
		}

		let smallest: Corridor
		let largest: Corridor

		// Find the smaller of the two corridors
		if (corridorA.length > corridorB.length) {
			smallest = corridorB
			largest = corridorA
		} else {
			smallest = corridorA
			largest = corridorB
		}

		// Merge the smallest into the largest
		for (const cell of smallest) {
			cell.region = largest.region
		}
		connection.region = largest.region
		connection.regionType = 'corridor'
		connection.type = 'floor'
	}

	protected connectRegions(): void {
		interface SimpleNeighbor {
			region: number
			x: number
			y: number
			type: string
		}

		interface Connection {
			key: string
			x: SimpleNeighbor[]
			y: SimpleNeighbor[]
			type: 'corridor' | 'door'
			tiles: Tile[]
		}

		const regionConnections: Record<string, Connection> = {}

		for (const row of this.tiles) {
			for (const tile of row) {
				if (tile.type !== 'wall' || tile.region !== -1 || this.nearEdge(tile)) {
					continue
				}

				const tileRegions = this.find().start(tile).cardinal().notRegion(-1).unique('region').get()
				if (tileRegions.length <= 1) {
					continue
				}

				const key = tileRegions.map(neighbor => neighbor.region).sort().join('-')
				if (!regionConnections[key]) {
					regionConnections[key] = {
						key,
						x: tileRegions.filter(neighbor => neighbor.x === tile.x).map(neighbor => neighbor.toJSON()),
						y: tileRegions.filter(neighbor => neighbor.y === tile.y).map(neighbor => neighbor.toJSON()),
						type: tileRegions.every(tile => tile.regionType === 'corridor') ? 'corridor' : 'door',
						tiles: []
					}
				}
				regionConnections[key].tiles.push(tile)
			}
		}

		let added_connections = 0

		const makeConnection = (key: string, door: Tile, type: string) => {
			if (type === 'door') {
				this.connectDoor(door, {name: key})
			} else if (type === 'corridor') {
				const connection = regionConnections[key]
				const [a, b] = key.split('-').map(v => parseInt(v))
				const parsedA = connection.x.find(v => v.region === a) || connection.y.find(v => v.region === a)
				const parsedB = connection.x.find(v => v.region === b) || connection.y.find(v => v.region === b)

				if (!parsedA || !parsedB) {
					return
				}

				const tileA = this.getTile(parsedA.x, parsedA.y)
				const tileB = this.getTile(parsedB.x, parsedB.y)
				try {
					this.connectCorridors(tileA.region, tileB.region, door)
				} catch (e) {
					$out.error(`Could not connect corridors`, {tileA, tileB, e})
				}
			}
			added_connections++
		}

		for (const key in regionConnections) {
			const {type, tiles} = regionConnections[key]
			added_connections = 0
			const doorCount: number = this.randBetween(1, this.options.maxDoors)

			let i = 0
			const failedByChance: Tile[] = []
			while (added_connections < doorCount && i < this.options.doorChance) {
				i++
				const rand: number = this.randBetween(0, tiles.length - 1)
				const door: Tile = tiles[rand]
				const byChance: boolean = this.oneIn(this.options.doorChance)
				if (
					!door.isCorner() &&
					!door.nearDoors() &&
					!door.isAtEnd() &&
					!this.nearEdge(door)
				) {
					if (byChance) {
						makeConnection(key, door, type)
					} else {
						failedByChance.push(door)
					}
				}
			}

			// If we didn't add any doors, just pick one of the failedByChance (if any) or fall back to a less desirable door spot if needed
			if (!added_connections) {
				const doors: Tile[] = failedByChance.length ? failedByChance : tiles
				const rand: number = this.randBetween(0, doors.length - 1)
				const door: Tile = doors[rand]
				makeConnection(key, door, type)
			}

			if (!added_connections) {
				$out.error(`Failed to add doors to region ${tiles[0].region}`)
			}
		}
	}

	protected reset(): void {
		this.state = objectCopy(this.initialState)
	}

	protected removeDeadEnds(): void {
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
						tile.find().cardinal().notType('wall').count() <= 1 &&
						!this.rooms.find(room => room.containsTile(tile.x, tile.y))
					) {
						this.resetTile(tile)
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

	async build(stage?: StageOptions): Promise<this> {
		// reset the state
		this.reset()

		// validate the state options
		this.validate(stage)

		// fill the entire area with solid 'wall' tiles
		await this.fill('wall')

		// Generate the maze
		await this.generateMaze()

		// create the rooms
		await this.addRooms()

		// Normalize region numbers
		await this.normalizeRegions()

		// create doors between rooms and corridors
		await this.connectRegions()

		if (this.options.removeDeadEnds) {
			// remove dead ends
			await this.removeDeadEnds()
		}

		return this
	}

	protected async addRooms(): Promise<void> {
		const roomRestrictionModifier = 4 * this.options.multiplier
		let outer_width_limit = this.stage.width - roomRestrictionModifier
		let outer_height_limit = this.stage.height - roomRestrictionModifier

		if (this.stage.width > 10 && outer_width_limit > this.stage.width * 0.5) {
			// if the width is greater than 10, it should not be greater than 40% of the stage width
			outer_width_limit = Math.ceil(this.stage.width * 0.4)
		}

		if (this.stage.height > 10 && outer_height_limit > this.stage.height * 0.5) {
			// if the height is greater than 10, it should not be greater than 40% of the stage height
			outer_height_limit = Math.ceil(this.stage.height * 0.4)
		}

		const carvePromises: Promise<any>[] = []

		for (let i = 0; i < this.options.roomTries; i++) {
			const carvableGridPoints = this.getCarvableGridPoints()

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

			// Restrict the size of rooms relative to the stage size, but at least 3x3
			width = Math.max(3, Math.min(width, outer_width_limit) - 1)
			height = Math.max(3, Math.min(height, outer_height_limit) - 1)

			const {x, y} = this.rng.pickone(carvableGridPoints)

			if (!this.hasTile(x + width, y + height)) {
				// Room is too big to fit on the map
				continue
			}

			const room = new Room(x, y, width, height)

			let overlaps = false
			for (const other of this.rooms) {
				// Check to make sure the room is either exactly 1 tile from another room (wall hugging)
				// or at least 3 tiles from another room (wall, corridor, wall)
				if (room.touches(other)) {
					overlaps = true
					break
				}
			}

			if (overlaps) {
				continue
			}

			this.rooms.push(room)

			// Create a new region for the room
			const region = this.startRegion('room')

			// Convert room tiles to floor, but don't wait for the promise to resolve
			carvePromises.push(this.carveArea({x, y}, width, height, {region: region.id}))
			carvePromises.push(this.carveHollow({x, y}, width, height, {region: -1, type: 'wall'}))
		}

		// Wait for all the room carving to finish
		await Promise.all(carvePromises)
	}

	protected async fill(type: TileType): Promise<TileMatrix> {
		let neighbors: Neighbors = {}
		let x
		let y

		const region = new Region()
		this.regions[region.id] = region

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

	protected async normalizeRegions(): Promise<void> {
		// Get all floor tiles
		const floorTiles = this.find().type('floor').get()
		const walked = new Set<Tile>()

		const cleanTile = (tile: Tile) => {
			this.resetTile(tile)
			walked.add(tile)
		}

		let region_id = 0
		for (const areaStartTile of floorTiles) {
			const corridor = areaStartTile.isCorridor()

			if (!walked.has(areaStartTile)) {
				const area = this.walk(areaStartTile)

				for (const tile of area) {
					if (!walked.has(tile)) {
						tile.region = region_id

						if (corridor) {
							// do corridor checks

							// corridor length should be at least the minimum length
							const isNotLongEnough = area.length < this.options.minCorridorLength

							// Corridor should not border a room
							const isNearRoom = tile.nearRoom()

							// Corridor should not border the edge of the map
							const isNearEdge = this.nearEdge(tile)

							if (isNearRoom || isNearEdge || isNotLongEnough) {
								// if the tile is near a room, it should be cleaned
								cleanTile(tile)

								// Guess corridor direction, then remove tiles bordering that are also corridors
								const direction = this.longestCorridorDirection(tile)

								// if it has any cardinal corridor neighbors in the same region, they should also be cleaned
								for (const neighbor of this.walkToEdge(tile, direction)) {
									if (neighbor.cardinal().find(t => t.isRoom())) {
										this.walkStraight(neighbor, false).map(cleanTile)
									}
								}
							}
						}

						// add changed tile to walked
						walked.add(tile)
					}
				}

				region_id++
			}
		}
	}
}
