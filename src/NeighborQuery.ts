import Tile, {TileType} from './Tile'

const cardinal = [
	'n',
	'e',
	's',
	'w'
]
const intercardinal = [
	'ne',
	'se',
	'sw',
	'nw'
]

export interface NeighborQueryOptions {
	levels?: number
	inclusive?: boolean
	cardinal?: boolean
	intercardinal?: boolean
	type?: TileType
	notType?: TileType
}

const defaultOptions: NeighborQueryOptions = {
	levels: 1,
	inclusive: false,
	cardinal: true,
	intercardinal: true
}

export class NeighborQuery {
	private tile: Tile
	private readonly options: NeighborQueryOptions

	constructor(tile: Tile, options: NeighborQueryOptions = {}) {
		this.tile = tile
		this.options = {
			...defaultOptions,
			...options
		}
	}

	setTile(tile: Tile): this {
		this.tile = tile
		return this
	}

	levels(levels = 1): this {
		this.options.levels = levels
		return this
	}

	cardinal(): this {
		this.options.cardinal = true
		return this
	}

	intercardinal(): this {
		this.options.intercardinal = true
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

	get(): Tile[] {
		if (this.options.levels > 1 && this.options.inclusive) {
			return this.levelHelper()
		}

		const directions = []
		if (this.options.cardinal) {
			directions.push(...cardinal)
		}
		if (this.options.intercardinal) {
			directions.push(...intercardinal)
		}

		const tiles = []

		for (const direction of directions) {
			const tile = this.tile.neighbors[direction]
			if (tile && (!this.options.type || tile.type === this.options.type) && (!this.options.notType || tile.type !== this.options.notType)) {
				tiles.push(tile)
			}
		}

		if (this.options.levels > 1 && this.options.inclusive) {
			tiles.push(...this.levelHelper())
		}

		return tiles
	}

	private levelHelper() {
		const neighbors: Tile[] = []

		const query = new NeighborQuery(this.tile, {...this.options})
			.levels(this.options.levels - 1)

		for (const neighbor of neighbors.slice()) {
			query.tile = neighbor

			neighbors.push(...query.get())
		}
		return neighbors
	}
}
