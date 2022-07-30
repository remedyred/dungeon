import {isNumber} from '@snickbit/utilities'
import Tile from '../structures/Tile'

/** Definitions **/

export interface Point {
	x: number
	y: number
}

export type PointArray = [number, number]

export type Coordinates = Point | PointArray | Tile

/** Constants **/

// The four cardinal directions: north, south, east, and west.
export const cardinalDirections: PointArray[] = [
	[0, 1], // north
	[1, 0], // east
	[0, -1], // south
	[-1, 0] // west
]

/** Helpers **/

export function parsePoint(optionalX: Point | PointArray | Tile | number, optionalY?: number): Point {
	let x: number
	let y: number

	if (Array.isArray(optionalX)) {
		[x, y] = optionalX
	} else if (isNumber(optionalX) && isNumber(optionalY)) {
		x = optionalX
		y = optionalY
	} else {
		({x, y} = optionalX as Point)
	}

	return {x, y}
}
