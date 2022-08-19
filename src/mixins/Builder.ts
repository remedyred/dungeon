import {DungeonState, safeMerge, State} from './State'
import {$out, DungeonOptions} from '../common'
import {cardinalDirections, Coordinates, parsePoint, Point, PointArray} from '../coordinates/Coordinates'
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
import Tile, {Neighbors, TileMatrix, TileType} from '../structures/Tile'
import Room from '../structures/Room'
import Chance from 'chance'

export type StageOptions = Pick<DungeonOptions, 'height' | 'seed' | 'width'>

export interface BuilderState {
	stage: StageOptions
	results?: Results
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Builder extends State, Random, RegionManager, RoomManager, CorridorManager, Walker, Carver {
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

	protected growMaze(coordinates: Coordinates, maze: Point[]): Point[] {
		const start = parsePoint(coordinates)

		const carvable: Point[] = []
		const cells: Point[] = []
		let lastDirection: Point

		const getDirection = (possibleCells: PointArray[]): Point => {
			let direction: Point
			const cellIds = possibleCells.map(v => v.toString())
			if (
				lastDirection &&
				cellIds.indexOf(lastDirection.toString()) > -1 &&
				this.randBetween(1, 100) > this.options.windingPercent
			) {
				direction = parsePoint(lastDirection)
			} else {
				const rand = this.randBetween(0, possibleCells.length - 1)
				direction = parsePoint(possibleCells[rand])
			}
			return direction
		}

		const pointDirection = (point: Point, direction?: PointArray): Point => {
			return point && direction ? {
				x: point.x + direction[0],
				y: point.y + direction[1]
			} : point
		}

		const inMaze = (point: Point, direction?: PointArray): boolean => {
			point = pointDirection(point, direction)
			return carvable.some(tile => tile.x === point.x && tile.y === point.y) || maze.some(tile => tile.x === point.x && tile.y === point.y)
		}

		const canCarve = (point: Point, direction?: PointArray): boolean => {
			point = pointDirection(point, direction)
			if (point && !inMaze(point) && this.canCarve(point)) {
				let floor_count = 0

				for (const direction of cardinalDirections) {
					const pt = pointDirection(point, direction)
					if (inMaze(pt)) {
						floor_count++

						if (floor_count > 2) {
							return false
						}
					}
				}

				return true
			}
			return false
		}

		if (!canCarve(start)) {
			return maze
		}

		cells.push(start)
		carvable.push(start)

		let count = 0

		const cell_count = this.randBetween(2, 3)
		while (carvable.length < cell_count && count < this.options.maxMazeTries) {
			count++

			// get the last cell in the list as the start point for this segment
			const cell = cells[cells.length - 1]

			// Get the possible directions to carve from this cell
			// Get them fresh each time, so we can check if it's different from the previous loop(s)
			const carvableDirections: PointArray[] = cardinalDirections.filter(direction => canCarve(cell, direction))

			// Check if there are any carvable directions
			if (carvableDirections.length) {
				// get 1 random direction from the list of carvable directions
				const direction: Point = getDirection(carvableDirections)

				// carve 2 tiles in the direction
				const new_cell_1 = {x: start.x + direction.x, y: start.y + direction.y}
				const new_cell_2 = {x: start.x + direction.x, y: start.y + direction.y}
				carvable.push(new_cell_1)
				carvable.push(new_cell_2)

				// set the 2nd cell in the stack, so we have a start point for the next loop
				cells.push(new_cell_2)

				lastDirection = direction
			} else {
				// If there are no carvable directions
				// remove the last cell from the stack
				cells.pop()

				// Setting null forces a new random direction
				lastDirection = null
			}
		}

		if (carvable.length) {
			maze.push(...carvable)
		}

		return maze
	}

	protected generateMazePrim(): Point[] {
		const maze: TileType[][] = new Array(this.stage.height)
		for (let y = 0; y < maze.length; y++) {
			maze[y] = new Array(this.stage.width).fill('wall')
		}

		const lookup = (field, x, y, defaultValue = 'floor') => {
			if (x < 0 || y < 0 || x >= this.stage.width || y >= this.stage.height) {
				return defaultValue
			}
			return field[y][x]
		}

		const walls = []
		const makePassage = (x, y) => {
			if (maze[y]) {
				maze[y][x] = 'floor'
				const candidates = cardinalDirections.map(direction => ({
					x: x + direction[0],
					y: y + direction[1]
				}))

				for (const wall of candidates) {
					if (lookup(maze, wall.x, wall.y) === 'wall') {
						walls.push(wall)
					}
				}
			}
		}

		makePassage(this.randBetween(0, this.stage.width), this.randBetween(0, this.stage.height))

		while (walls.length !== 0) {
			const {x, y} = walls.splice(this.randBetween(1, walls.length) - 1, 1)[0]

			const left = lookup(maze, x - 1, y)
			const right = lookup(maze, x + 1, y)
			const top = lookup(maze, x, y - 1)
			const bottom = lookup(maze, x, y + 1)

			if (left === 'floor' && right === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x + 1, y)
			} else if (right === 'floor' && left === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x - 1, y)
			} else if (top === 'floor' && bottom === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x, y + 1)
			} else if (bottom === 'floor' && top === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x, y - 1)
			}
		}

		const points: Point[] = []
		for (let y = 0; y < maze.length; y++) {
			for (let x = 0; x < maze[y].length; x++) {
				if (maze[y][x] === 'floor') {
					points.push({x, y})
				}
			}
		}
		return points
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
		await this.generateMaze(stage)

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

			let x = this.randBetween(0, Math.floor((this.stage.width - width) / 2)) * 2 + 1
			let y = this.randBetween(0, Math.floor((this.stage.height - height) / 2)) * 2 + 1

			// Make sure X dimension doesn't reach the edge of the stage
			if (x + width >= this.stage.width) {
				x = Math.max(1, this.stage.width - width - 1)
			}

			// Make sure Y dimension doesn't reach the edge of the stage
			if (y + height >= this.stage.height) {
				y = Math.max(1, this.stage.height - height - 1)
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

	protected async generateMaze(stage: StageOptions): Promise<void> {
		const availableStartPoints: Point[] = []

		if (this.options.corridorStrategy.includes('prim')) {
			const maze: Point[] = this.generateMazePrim()
			const tiles: Point[] = []

			// remove the tiles that are already rooms, or around the edge, etc.
			for (const point of maze) {
				if (this.canCarve(point)) {
					tiles.push(point)
				}
			}

			// carve the maze
			if (tiles.length) {
				await this.carve(tiles, 'corridor')
			}
		} else if (this.options.corridorStrategy.includes('room')) {
		// Get all the tiles bordering rooms, and prioritize them as maze starting points
			for (const room of this.rooms) {
				const roomAvailableStartPoints: Point[] = []
				// get all available tiles bordering the room
				const points = room.getBorderPoints(1)
				for (const point of points) {
					if (
						this.canCarve(point) &&
					!availableStartPoints.includes(point)
					) {
						roomAvailableStartPoints.push(point)
					}
				}

				// Randomly select some tiles to be the maze starting points
				const roomStartPoints: Point[] = []
				if (roomAvailableStartPoints.length > 1) {
					let startPointCount: number = this.randBetween(1, roomAvailableStartPoints.length)
					while (startPointCount > 0) {
						for (let i = 0; i < roomAvailableStartPoints.length; i++) {
							if (this.oneIn(i + 1)) {
								availableStartPoints.push(roomAvailableStartPoints.splice(i, 1)[0])
								startPointCount--
							}
						}
					}
					availableStartPoints.push(...roomStartPoints)
				}
			}

			// If generating maze corridors, add every other empty tile to the available start points
			if (this.options.corridorStrategy.find(s => s === 'maze' || s === 'prim')) {
				// Grab the remaining maze generation points to fill in the rest of the map
				for (let y = 1; y < stage.height; y += 2) {
					for (let x = 1; x < stage.width; x += 2) {
						const point = {x, y}
						if (
							this.canCarve(point) &&
							!availableStartPoints.includes(point)
						) {
							availableStartPoints.push(point)
						}
					}
				}

				let maze: Point[] = []

				// Now generate the maze corridors
				for (const point of availableStartPoints) {
					maze = this.growMaze(point, maze)
				}

				// carve the maze
				if (maze.length) {
					await this.carve(maze, 'corridor')
				}
			} else {
				// If not generating maze corridors, just fill in the points around the rooms
				await this.carve(availableStartPoints, 'corridor')
			}
		}
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
