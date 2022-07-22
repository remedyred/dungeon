import {TileMatrix} from './Dungeon'
import {Tile, TileType} from './Tile'
import {Coordinates, parsePoint, Point} from './Coordinates'
import {arrayUnique} from '@snickbit/utilities'
import {$out} from './common'
import {Out} from '@snickbit/out'

export type CardinalDirection = 'e' | 'n' | 's' | 'w'
export type IntercardinalDirection = 'ne' | 'nw' | 'se' | 'sw'
export type Direction = CardinalDirection | IntercardinalDirection

export type TileCallback = (tiles: Tile[]) => Tile[]

export interface QueryOptions {
	levels?: number
	inclusive?: boolean
	directions?: Direction[]
	strictDirections?: boolean
	type?: TileType
	notType?: TileType
	start?: Coordinates
	offset?: Point
	region?: number
	notRegion?: number
	debug?: boolean
	unique?: string
	where?: TileCallback[]
}

interface ParsedOptions {
	levels: number
	inclusive: boolean
	directions: Direction[]
	strictDirections?: boolean
	type?: TileType
	notType?: TileType
	start: Tile
	offset?: Point
	region?: number
	notRegion?: number
	debug: boolean
	unique?: string
	where?: TileCallback[]
}

const cardinal: CardinalDirection[] = [
	'n',
	'e',
	's',
	'w'
]
const intercardinal: IntercardinalDirection[] = [
	'ne',
	'se',
	'sw',
	'nw'
]

const directions: Direction[] = [...cardinal, ...intercardinal]

const defaultOptions: QueryOptions = {
	levels: 1,
	inclusive: false,
	directions: [],
	debug: false,
	where: []
}

export class Query {
	private tiles: Tile[]
	private readonly options: QueryOptions
	private out: Out

	constructor(tiles: Tile[] | TileMatrix, options: QueryOptions = {}) {
		this.tiles = tiles.flat()
		this.options = {
			...defaultOptions,
			...options
		}

		this.out = $out.prefix('Query')

		$out.verbose('Constructed query:', this.options)
	}

	setTiles(tiles: Tile[] | TileMatrix): this {
		this.tiles = tiles.flat()
		return this
	}

	offset(x: number, y: number): this
	offset(location: Coordinates): this
	offset(optionalX: Coordinates | number, y?: number): this {
		this.options.offset = parsePoint(optionalX, y)
		return this
	}

	levels(levels = 1): this {
		this.options.levels = levels
		return this
	}

	debug(enabled = true): this {
		this.options.debug = enabled
		return this
	}

	cardinal(): this {
		this.options.directions.push(...cardinal)
		this.options.strictDirections = true
		return this
	}

	intercardinal(): this {
		this.options.directions.push(...intercardinal)
		this.options.strictDirections = true
		return this
	}

	setDirections(directions: Direction[]): this {
		this.options.directions = directions
		return this
	}

	directions(directions: Direction[]): this {
		this.options.directions.push(...directions)
		return this
	}

	setDirection(direction: Direction): this {
		this.options.directions = [direction]
		return this
	}

	direction(direction: Direction): this {
		this.options.directions.push(direction)
		return this
	}

	region(region: number): this {
		this.options.region = region
		return this
	}

	notRegion(region: number): this {
		this.options.notRegion = region
		return this
	}

	unique(key: string): this {
		this.options.unique = key
		return this
	}

	type(type: TileType): this {
		this.options.type = type
		return this
	}

	notType(type: TileType): this {
		this.options.notType = type
		return this
	}

	start(x: number, y: number): this
	start(location: Coordinates): this
	start(optionalX: Coordinates | number, optionalY?: number): this {
		const {x, y} = parsePoint(optionalX, optionalY)
		this.options.start = {x, y}
		return this
	}

	private requiresStart(): boolean {
		return !!this.options.start ||
			!!this.options.offset ||
			this.options.directions?.length > 0
	}

	private validate(): ParsedOptions {
		const options = {...this.options}

		if (!options.start && this.requiresStart()) {
			this.#out('No start location specified, using first tile')
			if (this.tiles.length === 0) {
				throw new Error('No tiles provided')
			} else {
				options.start = parsePoint(this.tiles.slice(0, 1)[0])
			}
		}

		if (!options.directions?.length) {
			options.directions = [...directions]
		}
		options.directions = arrayUnique(options.directions)

		if (options.start) {
			const start = parsePoint(options.start)

			if (options.offset) {
				start.x += options.offset.x
				start.y += options.offset.y
			}

			const foundStart = this.tiles.find(tile => tile.x === start.x && tile.y === start.y)

			if (!foundStart) {
				throw new Error(`Start location not found: ${JSON.stringify(start)}`)
			}

			options.start = foundStart
		}

		if (options.levels < 0) {
			options.levels = 0
		}

		this.#out('Validated options:', options)

		return options as ParsedOptions
	}

	#out(...args: any[]) {
		if (this.options.debug) {
			this.out.force.debug(...args)
		}
	}

	where(callback: TileCallback): this {
		this.options.where.push(callback)
		return this
	}

	get(): Tile[] {
		const options: ParsedOptions = this.validate()

		let results: Tile[] = []
		let tiles: Tile[] = this.tiles.slice()
		let hasNorth = false
		let hasEast = false
		let hasSouth = false
		let hasWest = false
		let hasCardinal = false
		let hasIntercardinal = false

		if (this.requiresStart()) {
			if (options?.directions.length) {
				hasNorth = options.directions.includes('n') || options.directions.includes('ne') || options.directions.includes('nw')
				hasEast = options.directions.includes('e') || options.directions.includes('ne') || options.directions.includes('se')
				hasSouth = options.directions.includes('s') || options.directions.includes('se') || options.directions.includes('sw')
				hasWest = options.directions.includes('w') || options.directions.includes('nw') || options.directions.includes('sw')
				hasCardinal = options.directions.includes('n') || options.directions.includes('e') || options.directions.includes('s') || options.directions.includes('w')
				hasIntercardinal = options.directions.includes('ne') || options.directions.includes('se') || options.directions.includes('sw') || options.directions.includes('nw')
			}
		}

		for (const tile of tiles) {
			// Skip falsy tiles
			if (!tile) {
				this.#out('Skipping falsy tile')
				continue
			}

			let message = `${tile.x}x${tile.y} [${tile.type}] (${tile.region}). `

			// Skip tiles that don't match the type
			if (options.type && tile.type !== options.type) {
				this.#out(`${message}Skipping tile, should be type ${options.type}`)
				continue
			}

			// Skip tiles that match the notType
			if (options.notType && tile.type === options.notType) {
				this.#out(`${message}Skipping tile, should not be ${options.notType}`)
				continue
			}

			// if we have a start tile, check start tile queries
			if (this.requiresStart()) {
				this.#out(`${message}Checking start tile queries`)

				if (tile.x === options.start.x && tile.y === options.start.y) {
					this.#out(`${message}Skipping tile. Start tile found.`)
					continue
				}

				if (options?.directions.length) {
					if (!hasNorth && tile.y < options.start.y) {
						this.#out(`${message}Skipping tile. Tile should not be north of start tile.`)
						continue
					}

					if (!hasSouth && tile.y > options.start.y) {
						this.#out(`${message}Skipping tile. Tile should not be south of start tile.`)
						continue
					}

					if (!hasEast && tile.x > options.start.x) {
						this.#out(`${message}Skipping tile. Tile should not be east of start tile.`)
						continue
					}

					if (!hasWest && tile.x < options.start.x) {
						this.#out(`${message}Skipping tile. Tile should not be west of start tile.`)
						continue
					}

					if (this.options.strictDirections) {
						if (!hasCardinal && tile.x === options.start.x && tile.y === options.start.y) {
							this.#out(`${message}Skipping tile. Tile should not be cardinal of start tile.`)
							continue
						}
						if (!hasIntercardinal && tile.x !== options.start.x && tile.y !== options.start.y) {
							this.#out(`${message}Skipping tile. Tile should not be intercardinal of start tile.`)
							continue
						}
					}
				}

				if (options.region && tile.region !== options.region) {
					this.#out(`${message}Skipping tile, region should be ${options.region}`)
					continue
				}

				if (options.notRegion && tile.region === options.notRegion) {
					this.#out(`${message}Skipping tile, region should not be ${options.notRegion}`)
					continue
				}

				if (options.levels) {
					const xMin = Math.min(options.start.x, tile.x)
					const xMax = Math.max(options.start.x, tile.x)
					const yMin = Math.min(options.start.y, tile.y)
					const yMax = Math.max(options.start.y, tile.y)
					const xDiff = xMax - xMin
					const yDiff = yMax - yMin

					if (
						xDiff > options.levels ||
						yDiff > options.levels
					) {
						this.#out(`${message}Skipping tile, should be within ${options.levels} of ${options.start.x}x${options.start.y}`, {xDiff, yDiff})
						continue
					}
				}
			}

			this.#out(`${message}Adding tile`)

			results.push(tile)
		}

		for (const where of this.options.where) {
			try {
				results = where(results)
			} catch (e) {
				this.#out('Error in where callback:', e)
			}
		}

		if (options.unique) {
			results = arrayUnique(results, options.unique)
		}

		return results
	}
}
