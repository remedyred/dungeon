import {State} from './State'
import {cardinal} from '../query/Query'
import Tile from '../structures/Tile'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Walker extends State {}

export class Walker {
	protected walkToEdge(start: Tile, direction: string, inclusive = true): Tile[] {
		const tiles: Tile[] = []

		let current: Tile = start

		while (current?.isFloor()) {
			tiles.push(current)
			const next = current.getNeighbor(direction)
			if (!next) {
				break
			} else {
				current = next
			}
		}

		if (current?.isFloor() && !tiles.includes(current)) {
			tiles.push(current)
		}

		if (!inclusive) {
			// Remove the last tile
			tiles.pop()
		}

		return tiles
	}

	protected walkStraight(start: Tile, inclusive = true): Tile[] {
		const tiles: Tile[] = []

		for (const direction of cardinal) {
			if (start.getNeighbor(direction)?.isFloor()) {
				tiles.push(...this.walkToEdge(start, direction, inclusive))
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
				if (neighbor?.isFloor()) {
					walkSet(neighbor)
				}
			}
		}

		walkSet(start)

		return tiles
	}

	protected guessCorridorDirection(start: Tile): string {
		const tiles = {
			n: [] as Tile[],
			s: [] as Tile[],
			e: [] as Tile[],
			w: [] as Tile[]
		}

		for (const direction of cardinal) {
			tiles[direction].push(...this.walkToEdge(start, direction))
		}

		const guess = Math.max(...Object.values(tiles).map(tiles => tiles.length))

		return Object.keys(tiles).find(direction => tiles[direction].length === guess) || 'n'
	}
}
