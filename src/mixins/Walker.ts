import {State} from './State'
import {cardinal, CardinalDirection} from '../query/Query'
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

	protected guessCorridorDirections(start: Tile): CardinalDirection[] {
		const directions: CardinalDirection[] = []

		for (const direction of cardinal) {
			const neighbor = start.getNeighbor(direction)
			if (!neighbor) {
				continue
			}

			const isInRegion = neighbor.inRegion(start.region)
			const isFloor = neighbor.isFloor()

			if (isInRegion && isFloor) {
				directions.push(direction)
			}
		}

		return directions
	}

	protected longestCorridorDirection(start: Tile): CardinalDirection | undefined {
		let longest: {direction: CardinalDirection; length: number} | undefined

		for (const direction of cardinal) {
			const tiles = this.walkToEdge(start, direction).filter(tile => tile.inRegion(start.region))
			if (tiles.length > direction?.length) {
				longest = {direction, length: tiles.length}
			}
		}

		return longest?.direction
	}
}
