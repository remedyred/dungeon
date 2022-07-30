import {State} from './State'
import {cardinal} from '../query/Query'
import Tile from '../structures/Tile'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Walker extends State {}

export class Walker {
	protected walkStraight(start: Tile, inclusive = true): Tile[] {
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

	protected walk(start: Tile): Tile[] {
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
}
