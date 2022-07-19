import {TileMatrix} from './index'
import Room from './Room'

export class Results {
	rooms: Room[]
	tiles: TileMatrix
	seed: any

	constructor(rooms: Room[], tiles: TileMatrix, seed: any) {
		this.rooms = rooms
		this.tiles = tiles
		this.seed = seed
	}

	toJson() {
		const rooms = []
		const tiles = []

		for (const room of this.rooms) {
			rooms.push(room.toJson())
		}

		for (let x = 0; x < this.tiles.length; x++) {
			if (!tiles[x]) {
				tiles.push([])
			}
			for (let y = 0; y < this.tiles[x].length; y++) {
				const tile = this.tiles[x][y]
				tiles[x].push(tile.toJson())
			}
		}

		return {
			tiles,
			rooms,
			seed: this.seed
		}
	}
}
