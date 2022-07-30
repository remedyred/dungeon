import Tile from './Tile'

export class Corridor {
	region: number
	tiles: Tile[]

	constructor(region: number, tiles: Tile[]) {
		this.region = region
		this.tiles = tiles
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

	toJson() {
		return {
			region: this.region,
			tiles: this.tiles.map(tile => tile.toJson())
		}
	}

	toString() {
		return String(this.region)
	}
}
