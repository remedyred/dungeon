import {Tile, TileMatrix, TileType} from './structures/Tile'
import {Coordinates, parsePoint, Point} from './Coordinates'
import {arrayUnique, arrayWrap, isEmpty} from '@snickbit/utilities'
import {$out} from './common'
import {Out} from '@snickbit/out'
import {RegionType} from './structures/Region'

export type CardinalDirection = 'e' | 'n' | 's' | 'w'
export type IntercardinalDirection = 'ne' | 'nw' | 'se' | 'sw'
export type Direction = CardinalDirection | IntercardinalDirection

export type TileCallback = (tiles: Tile[]) => Tile[]

export interface QueryOptions {
	levels?: number
	inclusive?: boolean
	directions?: Direction[]
	strictDirections?: boolean
	type?: TileType | TileType[]
	notType?: TileType | TileType[]
	start?: Coordinates
	offset?: Point
	region?: number[] | number
	notRegion?: number[] | number
	regionType?: RegionType | RegionType[]
	notRegionType?: RegionType | RegionType[]
	debug?: boolean
	unique?: string
	where?: TileCallback[]
}

interface ParsedOptions {
	levels: number
	inclusive: boolean
	directions: Direction[]
	strictDirections?: boolean
	type?: TileType[]
	notType?: TileType[]
	start: Point
	offset?: Point
	region?: number[]
	notRegion?: number[]
	regionType?: RegionType[]
	notRegionType?: RegionType[]
	debug: boolean
	unique?: string
	where?: TileCallback[]
}

export const cardinal: CardinalDirection[] = [
	'n',
	'e',
	's',
	'w'
]
export const intercardinal: IntercardinalDirection[] = [
	'ne',
	'se',
	'sw',
	'nw'
]

export const directions: Direction[] = [...cardinal, ...intercardinal]

export class Query {
	private tiles: Tile[]
	private readonly options: ParsedOptions
	private out: Out
	private customDirections = false

	constructor(tiles: Tile[] | TileMatrix, options: QueryOptions = {}) {
		this.tiles = tiles.flat()
		this.options = this.validate({
			levels: 1,
			inclusive: false,
			directions: [],
			debug: false,
			where: [],
			regionType: [],
			notRegionType: [],
			region: [],
			notRegion: [],
			type: [],
			notType: [],
			...options
		})

		this.out = $out.clone().prefix('Query')

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
		return this.directions(cardinal, true)
	}

	intercardinal(): this {
		return this.directions(intercardinal, true)
	}

	setDirections(directions: Direction[], strict?: boolean): this {
		this.options.directions = directions
		if (strict !== undefined) {
			this.options.strictDirections = strict
		}
		this.customDirections = true
		return this
	}

	directions(directions: Direction[], strict?: boolean): this {
		return this.setDirections([...this.options.directions || [], ...directions], strict)
	}

	setDirection(direction: Direction, strict?: boolean): this {
		return this.setDirections([direction], strict)
	}

	direction(direction: Direction, strict?: boolean): this {
		return this.setDirections([...this.options.directions || [], direction], strict)
	}

	private pushOption(key: string, value: any): this {
		if (!this.options[key]) {
			this.options[key] = []
		}

		this.options[key].push(...arrayWrap(value))

		return this
	}

	region(region: number[] | number): this {
		this.pushOption('region', region)
		return this
	}

	notRegion(region: number[] | number): this {
		this.pushOption('notRegion', region)
		return this
	}

	regionType(type: RegionType | RegionType[]): this {
		this.pushOption('regionType', type)
		return this
	}

	notRegionType(type: RegionType | RegionType[]): this {
		this.pushOption('notRegionType', type)
		return this
	}

	unique(key: string): this {
		this.options.unique = key
		return this
	}

	type(type: TileType | TileType[]): this {
		this.pushOption('type', type)
		return this
	}

	notType(type: TileType | TileType[]): this {
		this.pushOption('notType', type)
		return this
	}

	start(x: number, y: number): this
	start(location: Coordinates): this
	start(optionalX: Coordinates | number, optionalY?: number): this {
		this.options.start = parsePoint(optionalX, optionalY)
		return this
	}

	private requiresStart(options?: ParsedOptions | QueryOptions): boolean {
		options = options || this.options
		if (!options) {
			return false
		}
		return !!options.start ||
			!!options.offset ||
			this.customDirections
	}

	private validate(options: QueryOptions): ParsedOptions {
		if (!options.start && this.requiresStart(options)) {
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

			if (!this.tiles.find(tile => tile.x === start.x && tile.y === start.y)) {
				throw new Error(`Start location not found: ${JSON.stringify(start)}`)
			}
		}

		if (options.levels < 0) {
			options.levels = 0
		}

		if (options.type) {
			options.type = arrayWrap(options.type)
		}

		if (options.notType) {
			options.notType = arrayWrap(options.notType)
		}

		if (options.region) {
			options.region = arrayWrap(options.region)
		}

		if (options.notRegion) {
			options.notRegion = arrayWrap(options.notRegion)
		}

		if (options.regionType) {
			options.regionType = arrayWrap(options.regionType)
		}

		if (options.notRegionType) {
			options.notRegionType = arrayWrap(options.notRegionType)
		}

		this.#out('Validated options:', options)

		return options as ParsedOptions
	}

	#out(...args: any[]) {
		if (this.options?.debug) {
			this.out.force.debug(...args)
		}
	}

	where(callback: TileCallback): this {
		this.options.where.push(callback)
		return this
	}

	async count(): Promise<number> {
		return (await this.get())?.length || 0
	}

	async get(): Promise<Tile[]> {
		const options: ParsedOptions = this.validate(this.options)

		let results: Tile[] = []
		let tiles: Tile[] = this.tiles.slice()
		let hasNorth = false
		let hasEast = false
		let hasSouth = false
		let hasWest = false
		let hasCardinal = false
		let hasIntercardinal = false

		if (this.requiresStart(options)) {
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

			let regionMessage = tile.region + (tile.regionType ? ` [${tile.regionType}]` : '')
			let message = `${tile.x}x${tile.y} [${tile.type}] (${regionMessage}}). `

			// Skip tiles that don't match the type
			if (!isEmpty(options.type) && !options.type.includes(tile.type)) {
				this.#out(`${message}Skipping tile, should be type ${options.type}`)
				continue
			}

			// Skip tiles that match the notType
			if (!isEmpty(options.notType) && options.notType.includes(tile.type)) {
				this.#out(`${message}Skipping tile, should not be ${options.notType}`)
				continue
			}

			if (!isEmpty(options.region) && !options.region.includes(tile.region)) {
				this.#out(`${message}Skipping tile, region should be ${options.region}`)
				continue
			}

			if (!isEmpty(options.notRegion) && options.notRegion.includes(tile.region)) {
				this.#out(`${message}Skipping tile, region should not be ${options.notRegion}`)
				continue
			}

			if (!isEmpty(options.regionType) && !options.regionType.includes(tile.regionType)) {
				this.#out(`${message}Skipping tile, region type should be ${options.regionType}`)
				continue
			}

			if (!isEmpty(options.notRegionType) && options.notRegionType.includes(tile.regionType)) {
				this.#out(`${message}Skipping tile, region type should not be ${options.notRegionType}`)
				continue
			}

			// if we have a start tile, check start tile queries
			if (this.requiresStart(options)) {
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
