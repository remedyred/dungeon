import {isNumber} from '@snickbit/utilities'
import Tile from './Tile'
import Victor from 'victor'

/** Definitions **/

export interface Point {
	x: number
	y: number
}

export type PointArray = [number, number]

export type Coordinates = Point | PointArray | Tile

/** Constants **/

const n = new Victor(0, 1)
const e = new Victor(1, 0)
const s = new Victor(0, -1)
const w = new Victor(-1, 0)

// The four cardinal directions: north, south, east, and west.
export const cardinalDirections = [
	n,
	e,
	s,
	w
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
