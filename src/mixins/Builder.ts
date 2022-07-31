import {DungeonState, safeMerge, State} from './State'
import {$out} from '../common'
import {arrayUnique, arrayWrap, isNumber, isString} from '@snickbit/utilities'
import {cardinalDirections, Coordinates, parsePoint, Point, PointArray} from '../coordinates/Coordinates'
import {Region, RegionType, regionTypes} from '../structures/Region'
import {Results} from '../Results'
import {Random} from './Random'
import {RegionManager} from './RegionManager'
import {RoomManager} from './RoomManager'
import {CorridorManager} from './CorridorManager'
import {Walker} from './Walker'
import {Corridor} from '../structures/Corridor'
import Tile, {Neighbors, TileMatrix, TileType} from '../structures/Tile'
import Room from '../structures/Room'
import Chance from 'chance'

export interface StageOptions {
	width: number
	height: number
	seed?: string
}

export interface BuilderState {
	stage: StageOptions
	results?: Results
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Builder extends State, Random, RegionManager, RoomManager, CorridorManager, Walker {
}

const default_stage: StageOptions = {
	width: 5,
	height: 5
}

const default_state: BuilderState = {stage: {...default_stage}}

export class Builder {
	init() {
		this.state = safeMerge<DungeonState>(this.state, default_state)
	}

	toJSON(): Results {
		return new Results(this.rooms, this.tiles, this.seed)
	}

	async build(stage?: StageOptions): Promise<this> {
		// validate the state options
		this.validate(stage)

		// fill the entire area with solid 'wall' tiles
		await this.fill('wall')

		// create the rooms
		await this.addRooms()

		// Generate the maze
		await this.generateMaze(stage)

		// Clear broken corridors, corridors that are too small, and corridors bordering a room
		await this.cleanCorridors()

		// Split the corridors into regions
		await this.splitCorridors()

		// create doors between rooms and corridors
		await this.connectRegions()

		if (this.options.removeDeadEnds) {
			// remove dead ends
			await this.removeDeadEnds()
		}

		// Normalize region numbers
		await this.normalizeRegions()

		return this
	}

	async carve(points: Coordinates | Coordinates[], optionalTypeOrRegion?: RegionType | TileType, optionalRegion?: RegionType | number): Promise<Tile[]> {
		const carvePromises = []
		const tiles: Tile[] = []

		points = arrayWrap(points)

		let type: TileType

		if (regionTypes.includes(optionalTypeOrRegion)) {
			type = 'floor'
			if (!optionalRegion) {
				optionalRegion = optionalTypeOrRegion as RegionType
			}
		} else {
			type = optionalTypeOrRegion as TileType
		}

		let region: number
		if (optionalRegion !== undefined) {
			if (isString(optionalRegion)) {
				region = this.startRegion(optionalRegion).id
			} else {
				region = optionalRegion
			}
		}

		for (let i = 0; i < points.length; i++) {
			const point = points[i]
			carvePromises.push(this.carveTile(point, type, region).then(tile => {
				return tiles.push(tile)
			}).catch(e => {
				$out.verbose(`[CarveError]`, e)
			}))
			if (i % 100 === 0 || i === points.length - 1) {
				await Promise.all(carvePromises.splice(0))
				carvePromises.length = 0
			}
		}

		if (carvePromises.length) {
			await Promise.all(carvePromises.splice(0))
		}

		return tiles
	}

	async carveArea(x: number, y: number, width: number, height: number, region?: number): Promise<void>
	async carveArea(location: Coordinates, width: number, height: number, region?: number): Promise<void>
	async carveArea(optionalX: Coordinates | number, yOrWidth: number, widthOrHeight: number, optionalHeightOrRegion?: number, optionalRegion?: number): Promise<void> {
		let x: number
		let y: number
		let width: number
		let height: number
		let region: number

		if (isNumber(optionalX)) {
			({x, y} = parsePoint(optionalX, yOrWidth as number))
			width = widthOrHeight
			height = optionalHeightOrRegion
			region = optionalRegion
		} else {
			({x, y} = parsePoint(optionalX as Coordinates))
			width = yOrWidth
			height = widthOrHeight
			region = optionalHeightOrRegion
		}

		for (let i = x; i < x + width; i++) {
			for (let j = y; j < y + height; j++) {
				this.setTile(i, j, 'floor', region)
			}
		}
	}

	async carveTile(x: number, y: number, type?: TileType, region?: number): Promise<Tile>
	async carveTile(location: Coordinates, type?: TileType, region?: number): Promise<Tile>
	async carveTile(optionalX: any, optionalY?: any, optionalType?: any, optionalRegion?: number): Promise<Tile> {
		return this.setTile(optionalX, optionalY, optionalType, optionalRegion)
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
			carvePromises.push(this.carveArea(x, y, width, height, region.id))
		}

		// Wait for all the room carving to finish
		await Promise.all(carvePromises)
	}

	protected canCarve(cell: Point, offset?: Coordinates): boolean {
		const checks: Record<string, Point> = {start: cell}

		if (offset) {
			const parsed = parsePoint(offset)
			checks.next = {x: cell.x + parsed.x, y: cell.y + parsed.y}
			checks.dest = {x: cell.x + parsed.x * 2, y: cell.y + parsed.y * 2}
			checks.after = {x: cell.x + parsed.x * 3, y: cell.y + parsed.y * 3}
		}

		for (const [check, def] of Object.entries(checks)) {
			if (!this.isCarvable(def, check)) {
				return false
			}
		}
		return true
	}

	protected cleanCorridors(): void {
		const corridors = this.getCorridors()
		let reclean = false
		const tilesToClean: Tile[] = []

		for (let corridor of corridors) {
			if (corridor.tiles.length < this.options.minCorridorLength) {
				tilesToClean.push(...corridor.tiles)
			} else if (!corridor.tiles.find(tile => tile.find().levels(2).cardinal().notRegion(tile.region).notRegion(-1).count() === 0)) {
				tilesToClean.push(...corridor.tiles)
			} else {
				for (let tile of corridor.tiles) {
					if (tile.cardinal().find(tile => tile.isRoom())) {
						tilesToClean.push(...this.walkStraight(tile, false))
					}
				}
			}
		}

		if (tilesToClean.length) {
			for (let tile of tilesToClean) {
				this.resetTile(tile)
			}
			reclean = true
		}

		if (reclean) {
			return this.cleanCorridors()
		}
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
				if (tile.type !== 'wall' || tile.region !== -1) {
					continue
				}

				const tileRegions = arrayUnique(tile.cardinal().filter(tile => tile.region !== -1), 'region')
				if (tileRegions.length !== 2) {
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

	protected async fill(type: TileType): Promise<TileMatrix> {
		let neighbors: Neighbors = {}
		let x
		let y

		// reset the region
		Region._id = 0
		const region = new Region(null, -1)
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

		if (this.options.corridorStrategy.includes('room')) {
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
			if (this.options.corridorStrategy.includes('maze')) {
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

				// Now generate the maze corridors
				let maze: Point[] = []
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

	protected isCarvable(cell: Point, check: string): boolean {
		if (!this.hasTile(cell)) {
			return false
		}

		const tile: Tile = this.getTile(cell)

		if (!tile.isWall()) {
			return false
		}

		if (check !== 'after' && tile.nearRoom()) {
			return false
		}

		if (tile.floors().length > 2) {
			return false
		}

		// noinspection RedundantIfStatementJS
		if (check !== 'after' && this.nearEdge(tile)) {
			return false
		}

		return true
	}

	protected async normalizeRegions(): Promise<void> {
		// normalize the region numbers so there aren't any gaps
		const regions = this.getRegions()

		if (regions[-1]) {
			delete regions[-1]
		}

		let region_id = 0
		for (const tiles of Object.values(regions)) {
			for (const tile of tiles) {
				tile.region = region_id
			}
			region_id++
		}
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

	protected async splitCorridors(): Promise<void> {
		const corridors = this.getCorridors().sort((a, b) => b.region - a.region)

		if (corridors.length === 0) {
			$out.warn('No corridors found!')
			return
		}

		// get the lowest region number
		let regionId = corridors[0].region

		const checkedTiles: Tile[] = []

		for (const corridor of corridors) {
			for (let tile of corridor.tiles) {
				if (!checkedTiles.includes(tile)) {
					const corridorTiles = this.walk(tile)
					this.startRegion('corridor', regionId++)
					for (const corridorTile of corridorTiles) {
						this.setTile(corridorTile, 'floor')
					}

					checkedTiles.push(...corridorTiles)
				}
			}
		}
	}
}
