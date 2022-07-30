import {DungeonState, safeMerge, State} from './State'
import {Coordinates, parsePoint} from '../coordinates/Coordinates'
import {isNumber} from '@snickbit/utilities'
import {$out} from '../common'
import {Query, QueryOptions} from '../query/Query'
import Tile, {TileMatrix, TileType} from '../structures/Tile'

export interface TileManagerState {
	tiles: TileMatrix
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TileManager extends State {}

const default_state: TileManagerState = {tiles: []}

export class TileManager {
	init() {
		this.state = safeMerge<DungeonState>(this.state, default_state)
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
}
