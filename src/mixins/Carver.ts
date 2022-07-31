import {State} from './State'
import {RegionType, regionTypes} from '../structures/Region'
import {TileManager} from './TileManager'
import {Coordinates, parsePoint, Point} from '../coordinates/Coordinates'
import {arrayWrap, isString} from '@snickbit/utilities'
import {$out} from '../common'
import {RegionManager} from './RegionManager'
import Tile, {TileType} from '../structures/Tile'
import Room from '../structures/Room'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Carver extends State, TileManager, RegionManager {}

export interface CarveOptions {
	region?: number
	regionType?: RegionType
	type?: TileType
}

export class Carver {
	private parseCarve(location: Coordinates, options?: CarveOptions) {
		const {x, y} = parsePoint(location)
		const type = options?.type || 'floor'
		const region = options?.region || -1
		return {x, y, region, type}
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

	async carveArea(location: Coordinates, width: number, height: number, options?: CarveOptions): Promise<void> {
		const {x, y, type, region} = this.parseCarve(location, options)
		for (let i = x; i < x + width; i++) {
			for (let j = y; j < y + height; j++) {
				this.setTile(i, j, type, region)
			}
		}
	}

	async carveHollow(location: Coordinates, width: number, height: number, options?: CarveOptions): Promise<void> {
		const {x, y, type, region} = this.parseCarve(location, options)

		const area = new Room(x, y, width, height)

		const points = area.getBorderPoints()
		await this.carve(points, type, region)
	}

	async carveTile(x: number, y: number, type?: TileType, region?: number): Promise<Tile>
	async carveTile(location: Coordinates, type?: TileType, region?: number): Promise<Tile>
	async carveTile(optionalX: any, optionalY?: any, optionalType?: any, optionalRegion?: number): Promise<Tile> {
		return this.setTile(optionalX, optionalY, optionalType, optionalRegion)
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
}
