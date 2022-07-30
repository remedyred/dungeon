import {arrayUnique, arrayWrap, isNumber, isString} from '@snickbit/utilities'
import {cardinalDirections, Coordinates, parsePoint, Point, PointArray} from './coordinates/Coordinates'
import {isBrowser} from 'browser-or-node'
import {$out, defaultDungeonOptions, defaultStageOptions, DungeonOptions, StageOptions} from './common'
import {cardinal, Query, QueryOptions} from './query/Query'
import {Region, RegionType, regionTypes} from './structures/Region'
import {Corridor} from './structures/Corridor'
import {State} from './State'
import {Results} from './Results'
import Tile, {Neighbors, TileMatrix, TileType} from './structures/Tile'
import Chance from 'chance'
import Room from './structures/Room'

export class Dungeon extends State {
	options: DungeonOptions
	stage: StageOptions
	rng: Chance.Chance

	constructor(options?: DungeonOptions) {
		super()
		this.options = {...defaultDungeonOptions, ...options}
		this.options.multiplier = this.options.multiplier > 0 ? parseInt(String(this.options.multiplier || 1)) || 1 : 1
	}

	randBetween(min: number, max: number): number {
		return this.rng.integer({min, max})
	}

	getTile(x: number, y: number): Tile
	getTile(location: Coordinates): Tile
	getTile(optionalX: Coordinates | number, optionalY?: number): Tile {
		const {x, y} = parsePoint(optionalX, optionalY)
		if (this.tiles[x] && this.tiles[x][y]) {
			return this.tiles[x][y]
		}

		throw new RangeError(`tile at ${x}x${y} is unreachable`)
	}

	hasTile(x: number, y: number): boolean
	hasTile(location: Coordinates): boolean
	hasTile(optionalX: Coordinates | number, optionalY?: number): boolean {
		const {x, y} = parsePoint(optionalX, optionalY)
		return !!(this.tiles[x] && this.tiles[x][y])
	}

	setTile(x: number, y: number, type?: TileType, region?: number): Tile
	setTile(location: Coordinates, type?: TileType, region?: number): Tile
	setTile(optionalX: Coordinates | number, optionalY?: TileType | number, optionalType?: TileType | number, optionalRegion?: number): Tile {
		let x: number
		let y: number
		let type: TileType
		let region_id: number

		if (isNumber(optionalX)) {
			({x, y} = parsePoint(optionalX, optionalY as number))
			type = optionalType as TileType
			region_id = optionalRegion
		} else {
			({x, y} = parsePoint(optionalX as Coordinates))
			type = optionalY as TileType
			region_id = optionalType as number
		}

		const region = region_id in this.regions ? this.regions[region_id] : this.region

		$out.verbose('setTile', {x, y, type, region: region.id, regionType: region.type})

		const tile = this.getTile(x, y)
		tile.type = type ?? 'floor'
		tile.region = region.id
		tile.regionType = region.type

		return tile
	}

	resetTile(x: number, y: number): Tile
	resetTile(location: Coordinates): Tile
	resetTile(optionalX: Coordinates | number, optionalY?: number): Tile {
		const {x, y} = parsePoint(optionalX, optionalY)

		const tile = this.getTile(x, y)
		tile.type = 'wall'
		tile.region = -1
		tile.regionType = undefined
		return tile
	}

	find(options?: QueryOptions) {
		return new Query(this.tiles, options)
	}

	nearEdge(x: number, y: number): boolean
	nearEdge(location: Coordinates): boolean
	nearEdge(optionalX: Coordinates | number, optionalY?: number): boolean {
		const {x, y} = parsePoint(optionalX, optionalY)
		return x === 0 || y === 0 || x === this.stage.width - 1 || y === this.stage.height - 1
	}

	getRegions(): Record<number, Tile[]> {
		const regions: Record<number, Tile[]> = {}

		for (let tile of this.tiles.flat()) {
			if (!regions[tile.region]) {
				regions[tile.region] = []
			}
			regions[tile.region].push(tile)
		}

		return regions
	}

	toJSON(): Results {
		return new Results(this.rooms, this.tiles, this.seed)
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

		this.seed = stage.seed
		this.rng = new Chance(this.seed)

		this.stage = stage
	}

	private walkStraight(start: Tile, inclusive = true): Tile[] {
		const tiles: Tile[] = []

		const walkToEdge = (start: Tile, direction: string) => {
			const tiles: Tile[] = []

			let current: Tile = start

			while (current?.isCorridor()) {
				tiles.push(current)
				const next = current.getNeighbor(direction)
				if (!next) {
					break
				} else {
					current = next
				}
			}

			if (current?.isCorridor() && !tiles.includes(current)) {
				tiles.push(current)
			}

			if (!inclusive) {
				// Remove the last tile
				tiles.pop()
			}

			return tiles
		}

		for (const direction of cardinal) {
			if (start.getNeighbor(direction)?.isCorridor()) {
				tiles.push(...walkToEdge(start, direction))
			}
		}

		return tiles
	}

	private walk(start: Tile): Tile[] {
		const tiles: Tile[] = []
		const checkedTiles: Tile[] = []

		const walkSet = (tile: Tile) => {
			if (checkedTiles.includes(tile)) {
				return
			}
			checkedTiles.push(tile)
			tiles.push(tile)
			for (const direction of cardinal) {
				const neighbor = tile.getNeighbor(direction)
				if (neighbor?.isCorridor()) {
					walkSet(neighbor)
				}
			}
		}

		walkSet(start)

		return tiles
	}

	// noinspection JSMethodCanBeStatic
	private connectDoor(tile: Tile, options?: {region?: number; name?: number | string}): void {
		if (options.region) {
			tile.region = options.region
		}
		if (options.name) {
			tile.name = String(options.name)
		}
		tile.type = 'door'
	}

	private oneIn(num: number): boolean {
		return this.randBetween(1, num) === 1
	}

	private async connectCorridors(a: number | string, b: number | string, connection: Tile): Promise<void> {
		$out.debug(`connectCorridors(${a}, ${b}, ${connection})`)

		const corridors = await this.getCorridors()
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

	private async getCorridors(): Promise<Corridor[]> {
		const corridorTiles = await this.find().regionType('corridor').get()
		const corridors: Record<number, Corridor> = {}

		for (let tile of corridorTiles) {
			if (!corridors[tile.region]) {
				corridors[tile.region] = new Corridor(tile.region, [])
			}
			corridors[tile.region].push(tile)
		}

		return Object.values(corridors)
	}

	private async isCarvable(cell: Point, check: string): Promise<boolean> {
		if (!this.hasTile(cell)) {
			$out.verbose(`No tile at ${cell.x}x${cell.y}`)
			return false
		}

		const tile: Tile = this.getTile(cell)

		if (!tile.isWall()) {
			$out.verbose(`Tile at ${cell.x}x${cell.y} is not a wall`)
			return false
		}

		if (check !== 'after' && await tile.nearRoom()) {
			$out.verbose(`Tile at ${cell.x}x${cell.y} is near a room`)
			return false
		}

		if (check !== 'after' && this.nearEdge(tile)) {
			$out.verbose(`Tile at ${cell.x}x${cell.y} is near the edge`)
			return false
		}

		$out.verbose(`Tile at ${cell.x}x${cell.y} is carvable`)
		return true
	}

	private async canCarve(cell: Point, offset?: Coordinates): Promise<boolean> {
		const checks: Record<string, Point> = {start: cell}

		if (offset) {
			const parsed = parsePoint(offset)
			checks.next = {x: cell.x + parsed.x, y: cell.y + parsed.y}
			checks.dest = {x: cell.x + parsed.x * 2, y: cell.y + parsed.y * 2}
			checks.after = {x: cell.x + parsed.x * 3, y: cell.y + parsed.y * 3}
		}

		for (const [check, def] of Object.entries(checks)) {
			if (!await this.isCarvable(def, check)) {
				$out.verbose(`growMaze.canCarve [${check}] ${def.x}x${def.y} is not carvable`)
				return false
			}
		}

		$out.verbose(`growMaze.canCarve ${cell.x}x${cell.y} is carvable`)
		return true
	}

	private async growMaze(startX: number, startY: number): Promise<void>
	private async growMaze(start: Coordinates): Promise<void>
	private async growMaze(startOrX: Coordinates | number, startY?: number): Promise<void> {
		let start = parsePoint(startOrX, startY)

		const cells: Point[] = []
		const carvable: Point[] = []
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

		if (!await this.canCarve(start)) {
			$out.warn(`growMaze ${start.x}x${start.y} is not carvable`)
			return
		}

		cells.push(start)
		carvable.push(start)

		let count = 0
		while (cells.length && count < this.options.maxMazeTries) {
			count++

			// get the last cell in the list as the start point for this segment
			const cell = cells[cells.length - 1]

			// Get the possible directions to carve from this cell
			// Get them fresh each time, so we can check if it's different from the previous loop(s)
			const carvableDirections: PointArray[] = []
			await Promise.all(cardinalDirections.map(direction => this.canCarve(cell, direction).then(() => {
				carvableDirections.push(direction)
			}).catch(e => {
				$out.verbose(`growMaze.canCarve ${cell.x}x${cell.y} is not carvable`, e)
			})))

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

		$out.verbose(`growMaze ${start.x}x${start.y} carving complete after ${count} tries. Found ${carvable.length} carvable cells`)

		// carve the paths
		if (carvable.length > 1) {
			await this.carve(carvable, 'corridor')
		}
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

	async carveTile(x: number, y: number, type?: TileType, region?: number): Promise<Tile>
	async carveTile(location: Coordinates, type?: TileType, region?: number): Promise<Tile>
	async carveTile(optionalX: any, optionalY?: any, optionalType?: any, optionalRegion?: number): Promise<Tile> {
		return this.setTile(optionalX, optionalY, optionalType, optionalRegion)
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

	private async normalizeRegions(): Promise<void> {
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

	private async splitCorridors(): Promise<void> {
		const corridors = (await this.getCorridors()).sort((a, b) => b.region - a.region)

		if (corridors.length === 0) {
			$out.warn('No corridors found!')
			return
		}

		$out.debug('Splitting corridors...', corridors.map(corridor => corridor.region))

		// get the lowest region number
		let regionId = corridors[0].region

		const checkedTiles: Tile[] = []

		for (const corridor of corridors) {
			$out.debug(`Splitting corridor ${corridor}`)
			for (let tile of corridor.tiles) {
				if (!checkedTiles.includes(tile)) {
					const corridorTiles = this.walk(tile)
					$out.debug(`Found ${corridorTiles.length} tiles in corridor ${corridor}`).extra(corridorTiles.map(tile => tile.name))
					this.startRegion('corridor', regionId++)
					for (const corridorTile of corridorTiles) {
						this.setTile(corridorTile, 'floor')
					}

					checkedTiles.push(...corridorTiles)
				}
			}
		}
	}

	private async removeDeadEnds(): Promise<void> {
		let done = false

		const cycle = async () => {
			let done = true
			for (const row of this.tiles) {
				for (const tile of row) {
					// If it only has one exit, it's a dead end --> fill it in!
					if (tile.type === 'wall') {
						continue
					}
					if (
						await tile.find().cardinal().notType('wall').count() <= 1 &&
						!this.rooms.find(room => room.containsTile(tile.x, tile.y))
					) {
						$out.debug(`Found dead end at ${tile.x}, ${tile.y}`)
						this.resetTile(tile)
						done = false
					}
				}
			}

			return done
		}

		while (!done) {
			done = true
			done = await cycle()
		}
	}

	private async connectRegions(): Promise<void> {
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

		$out.debug('Connecting regions...').extra(arrayUnique(this.tiles.flat().map(v => v.region)))

		for (const row of this.tiles) {
			for (const tile of row) {
				if (tile.type !== 'wall' || tile.region !== -1) {
					continue
				}

				const tileRegions = await this.find()
					.start(tile)
					.unique('region')
					.cardinal()
					.levels()
					.notRegion(-1)
					.get()
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

		$out.debug(`Found ${Object.keys(regionConnections).length} regions to connect`, Object.keys(regionConnections).sort()).extra(Object.keys(regionConnections))

		let added_connections = 0

		const makeConnection = (key: string, door: Tile, type: string) => {
			$out.verbose(`Door at ${door.x}, ${door.y}`)
			if (type === 'door') {
				this.connectDoor(door, {name: key})
			} else if (type === 'corridor') {
				const connection = regionConnections[key]
				const [a, b] = key.split('-').map(v => parseInt(v))
				const parsedA = connection.x.find(v => v.region === a) || connection.y.find(v => v.region === a)
				const parsedB = connection.x.find(v => v.region === b) || connection.y.find(v => v.region === b)

				if (!parsedA || !parsedB) {
					$out.error(`Could not find connection for ${key}`, {connection, parsedB, parsedA})
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
					!await door.nearDoors() &&
					!await door.isAtEnd()
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
				$out.debug(`Forced Door at ${door.x}, ${door.y}`)
				makeConnection(key, door, type)
			}

			if (!added_connections) {
				$out.error(`Failed to add doors to region ${tiles[0].region}`)
			}
		}
	}

	private async cleanCorridors(): Promise<void> {
		const corridors = await this.getCorridors()
		let reclean = false
		const tilesToClean: Tile[] = []

		$out.verbose('Cleaning corridors...', corridors)

		for (let corridor of corridors) {
			if (corridor.tiles.length < this.options.minCorridorLength) {
				$out.debug(`Corridor ${corridor} is too short, removing... ${corridor.tiles.map(tile => tile.name).join(', ')}`)
				tilesToClean.push(...corridor.tiles)
			} else if (!corridor.tiles.find(async tile => await tile.find().levels(2).cardinal().notRegion(tile.region).notRegion(-1).count() === 0)) {
				tilesToClean.push(...corridor.tiles)
			} else {
				for (let tile of corridor.tiles) {
					if ((await tile.cardinal()).find(tile => tile.isRoom())) {
						$out.debug(`Corridor ${corridor} tile ${tile.name} is connected to a room, removing...`)
						tilesToClean.push(...this.walkStraight(tile, false))
					}
				}
			}
		}

		if (tilesToClean.length) {
			for (let tile of tilesToClean) {
				this.resetTile(tile)
			}

			$out.debug('Found tiles to clean, recleaning...')
			reclean = true
		}

		if (reclean) {
			return this.cleanCorridors()
		}
	}

	private async generateMaze(stage: StageOptions): Promise<void> {
		const availableStartPoints: Point[] = []

		// Get all the tiles bordering rooms, and prioritize them as maze starting points
		for (const room of this.rooms) {
			// get the tiles bordering the room
			const points = room.getBorderPoints(1)
			for (const point of points) {
				if (
					await this.canCarve(point) &&
					!availableStartPoints.includes(point)
				) {
					const byChance: boolean = this.oneIn(Math.ceil(points.length / 2))
					if (byChance) {
						availableStartPoints.push(point)
					}
				}
			}
		}

		if (this.options.mazeCorridors) {
		// Grab the remaining maze generation points to fill in the rest of the map
			for (let y = 1; y < stage.height; y += 2) {
				for (let x = 1; x < stage.width; x += 2) {
					const point = {x, y}
					if (
						await this.canCarve(point) &&
						!availableStartPoints.includes(point)
					) {
						availableStartPoints.push(point)
					}
				}
			}
		}

		$out.debug(`Generating maze with ${availableStartPoints.length} starting points. ${this.options.mazeCorridors ? 'With maze corridors.' : 'Without maze corridors.'}`)

		if (this.options.mazeCorridors) {
			for (const point of availableStartPoints) {
				await this.growMaze(point)
			}
		} else {
			await this.carve(availableStartPoints, 'corridor')
		}
	}

	async fill(type: TileType): Promise<TileMatrix> {
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

	private async addRooms(): Promise<void> {
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

	async build(stage?: StageOptions): Promise<this> {
		stage = {...defaultStageOptions, ...stage}

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
}

export function dungeon(options?: DungeonOptions): Dungeon {
	return new Dungeon(options)
}

if (isBrowser) {
	window.dungeon = dungeon
}

