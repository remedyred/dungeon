import {cardinalDirections, Coordinates, parsePoint, Point, PointArray} from '../coordinates/Coordinates'
import {TileType} from '../structures/Tile'
import {State} from './State'
import {Random} from './Random'
import {RegionManager} from './RegionManager'
import {RoomManager} from './RoomManager'
import {CorridorManager} from './CorridorManager'
import {Walker} from './Walker'
import {Carver} from './Carver'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Maze extends State, Random, RegionManager, RoomManager, CorridorManager, Walker, Carver {
}

export class Maze {
	protected generateMazePrim(): Point[] {
		const maze: TileType[][] = new Array(this.stage.height)
		for (const tile of this.tiles.flat()) {
			if (!maze[tile.y]) {
				maze[tile.y] = new Array(this.stage.width)
			}
			maze[tile.y][tile.x] = tile.type
		}

		const lookup = (field, x, y, defaultValue: TileType = 'floor') => {
			if (x <= 0 || y <= 0 || x >= this.stage.width || y >= this.stage.height) {
				return defaultValue
			}
			return field[y][x]
		}

		const walls = []
		const makePassage = (x, y) => {
			if (maze[y]) {
				maze[y][x] = 'floor'
				const candidates = cardinalDirections.map(direction => ({
					x: x + direction[0],
					y: y + direction[1]
				}))

				for (const wall of candidates) {
					if (lookup(maze, wall.x, wall.y) === 'wall') {
						walls.push(wall)
					}
				}
			}
		}

		makePassage(this.randBetween(0, this.stage.width), this.randBetween(0, this.stage.height))

		while (walls.length !== 0) {
			const {x, y} = walls.splice(this.randBetween(1, walls.length) - 1, 1)[0]

			const neighbors = {
				left: lookup(maze, x - 1, y, 'wall'),
				right: lookup(maze, x + 1, y, 'wall'),
				top: lookup(maze, x, y - 1, 'wall'),
				bottom: lookup(maze, x, y + 1, 'wall')
			}

			if (Object.values(neighbors).every(value => value === 'wall')) {
				const direction = this.rng.pickone(Object.keys(neighbors))
				neighbors[direction] = 'floor'
			}

			if (neighbors.left === 'floor' && neighbors.right === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x + 1, y)
			} else if (neighbors.right === 'floor' && neighbors.left === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x - 1, y)
			} else if (neighbors.top === 'floor' && neighbors.bottom === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x, y + 1)
			} else if (neighbors.bottom === 'floor' && neighbors.top === 'wall') {
				maze[y][x] = 'floor'
				makePassage(x, y - 1)
			}
		}

		const points: Point[] = []
		for (let y = 0; y < maze.length; y++) {
			for (let x = 0; x < maze[y].length; x++) {
				if (maze[y][x] === 'floor') {
					points.push({x, y})
				}
			}
		}
		return points
	}

	protected generateMazeRoom(): Point[] {
		const availableStartPoints: Point[] = []

		// Get all the tiles bordering rooms, and prioritize them as maze starting points
		for (const room of this.rooms) {
			const roomAvailableStartPoints: Point[] = []
			// get all available tiles bordering the room
			const points = room.getBorderPoints(1)
			for (const point of points) {
				if (
					this.canCarve(point) &&
					!availableStartPoints.includes(point)
				) {
					roomAvailableStartPoints.push(point)
				}
			}

			// Randomly select some tiles to be the maze starting points
			const roomStartPoints: Point[] = []
			if (roomAvailableStartPoints.length > 1) {
				let startPointCount: number = this.randBetween(1, roomAvailableStartPoints.length)
				while (startPointCount > 0) {
					for (let i = 0; i < roomAvailableStartPoints.length; i++) {
						if (this.oneIn(i + 1)) {
							availableStartPoints.push(roomAvailableStartPoints.splice(i, 1)[0])
							startPointCount--
						}
					}
				}
				availableStartPoints.push(...roomStartPoints)
			}
		}

		return availableStartPoints
	}

	protected generateMazeGrid(): Point[] {
		const availableStartPoints: Point[] = []
		// Grab the remaining maze generation points to fill in the rest of the map
		for (let y = 1; y < this.stage.height; y += 2) {
			for (let x = 1; x < this.stage.width; x += 2) {
				const point = {x, y}
				if (
					this.canCarve(point) &&
					!availableStartPoints.includes(point)
				) {
					availableStartPoints.push(point)
				}
			}
		}

		return availableStartPoints
	}

	protected growMaze(coordinates: Coordinates, maze: Point[]): Point[] {
		const start = parsePoint(coordinates)

		const carvable: Point[] = []
		const cells: Point[] = []
		let lastDirection: Point

		const getDirection = (possibleCells: PointArray[]): Point => {
			let direction: Point
			const cellIds = possibleCells.map(v => v.toString())
			if (
				lastDirection &&
				cellIds.indexOf(lastDirection.toString()) > -1 &&
				this.randBetween(1, 100) > this.options.windingPercent
			) {
				direction = parsePoint(lastDirection)
			} else {
				const rand = this.randBetween(0, possibleCells.length - 1)
				direction = parsePoint(possibleCells[rand])
			}
			return direction
		}

		const pointDirection = (point: Point, direction?: PointArray): Point => {
			return point && direction ? {
				x: point.x + direction[0],
				y: point.y + direction[1]
			} : point
		}

		const inMaze = (point: Point, direction?: PointArray): boolean => {
			point = pointDirection(point, direction)
			return carvable.some(tile => tile.x === point.x && tile.y === point.y) || maze.some(tile => tile.x === point.x && tile.y === point.y)
		}

		const canCarve = (point: Point, direction?: PointArray): boolean => {
			point = pointDirection(point, direction)
			if (point && !inMaze(point) && this.canCarve(point)) {
				let floor_count = 0

				for (const direction of cardinalDirections) {
					const pt = pointDirection(point, direction)
					if (inMaze(pt)) {
						floor_count++

						if (floor_count > 2) {
							return false
						}
					}
				}

				return true
			}
			return false
		}

		if (!canCarve(start)) {
			return maze
		}

		cells.push(start)
		carvable.push(start)

		let count = 0

		const cell_count = this.randBetween(2, 3)
		while (carvable.length < cell_count && count < this.options.maxMazeTries) {
			count++

			// get the last cell in the list as the start point for this segment
			const cell = cells[cells.length - 1]

			// Get the possible directions to carve from this cell
			// Get them fresh each time, so we can check if it's different from the previous loop(s)
			const carvableDirections: PointArray[] = cardinalDirections.filter(direction => canCarve(cell, direction))

			// Check if there are any carvable directions
			if (carvableDirections.length) {
				// get 1 random direction from the list of carvable directions
				const direction: Point = getDirection(carvableDirections)

				// carve 2 tiles in the direction
				const new_cell_1 = {x: start.x + direction.x, y: start.y + direction.y}
				const new_cell_2 = {x: start.x + direction.x, y: start.y + direction.y}
				carvable.push(new_cell_1)
				carvable.push(new_cell_2)

				// set the 2nd cell in the stack, so we have a start point for the next loop
				cells.push(new_cell_2)

				lastDirection = direction
			} else {
				// If there are no carvable directions
				// remove the last cell from the stack
				cells.pop()

				// Setting null forces a new random direction
				lastDirection = null
			}
		}

		if (carvable.length) {
			maze.push(...carvable)
		}

		return maze
	}

	protected async generateMaze(): Promise<void> {
		const availableStartPoints: Point[] = []

		if (this.options.corridorStrategy.includes('room')) {
			// Get all the tiles bordering rooms, and prioritize them as maze starting points
			availableStartPoints.push(...this.generateMazeRoom())
		}

		// If generating maze corridors, add every other empty tile to the available start points
		if (this.options.corridorStrategy.find(s => s === 'maze' || s === 'prim')) {
			availableStartPoints.push(...this.generateMazeGrid())

			let maze: Point[] = []

			if (this.options.corridorStrategy.includes('prim')) {
				maze = this.generateMazePrim()

				// remove the tiles that are already rooms, or around the edge, etc.
				for (const point of maze) {
					if (this.canCarve(point)) {
						availableStartPoints.push(point)
					}
				}
			} else {
				// Now generate the maze corridors
				for (const point of availableStartPoints) {
					maze = this.growMaze(point, maze)
				}
			}

			// carve the maze
			if (maze.length) {
				await this.carve(maze, 'corridor')
			} else {
				throw new Error('No maze generated')
			}
		} else {
			// If not generating maze corridors, just fill in the points around the rooms
			await this.carve(availableStartPoints, 'corridor')
		}
	}
}
