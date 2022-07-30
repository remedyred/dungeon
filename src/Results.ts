import {TileMatrix} from './structures/Tile'
import Room from './structures/Room'

export class Results {
	rooms: Room[]
	tiles: TileMatrix
	seed: any

	constructor(rooms: Room[], tiles: TileMatrix, seed: any) {
		this.rooms = rooms
		this.tiles = tiles
		this.seed = seed
	}

	toJSON() {
		const rooms = []
		const tiles = []

		for (const room of this.rooms) {
			rooms.push(room.toJSON())
		}

		for (let x = 0; x < this.tiles.length; x++) {
			if (!tiles[x]) {
				tiles.push([])
			}
			for (let y = 0; y < this.tiles[x].length; y++) {
				const tile = this.tiles[x][y]
				tiles[x].push(tile.toJSON())
			}
		}

		return {
			tiles,
			rooms,
			seed: this.seed
		}
	}
}
