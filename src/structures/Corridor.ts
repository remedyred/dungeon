import Tile, {TileMatrix} from './Tile'

export class Corridor {
	region: number
	tiles: Tile[]

	constructor(region: number, tiles: Tile[] | TileMatrix) {
		this.region = region
		this.tiles = tiles.flat()
	}

	get length(): number {
		return this.tiles.length
	}

	isRegion(region: number | string): boolean {
		return this.region === parseInt(String(region))
	}

	push(tile: Tile) {
		this.tiles.push(tile)
	}

	remove(tile: Tile) {
		this.tiles.splice(this.tiles.indexOf(tile), 1)
	}

	[Symbol.iterator]() {
		let index = 0
		return {
			next: () => {
				if (index < this.tiles.length) {
					return {value: this.tiles[index++], done: false}
				}
				return {done: true}
			}
		}
	}

	toJSON() {
		return {
			region: this.region,
			tiles: this.tiles.map(tile => tile.toJSON())
		}
	}

	toString() {
		return String(this.region)
	}
}
