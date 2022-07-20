import {isNumber} from '@snickbit/utilities'
import Tile from './Tile'
import Victor from 'victor'
import Cell from './Cell'

/** Definitions **/

export interface Point {
	x: number
	y: number
}

export type Coordinates = Cell | Point | Tile

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

export function parsePoint(optionalX: Cell | Point | Tile | number, optionalY: number): Point {
	if (isNumber(optionalX) && isNumber(optionalY)) {
		return {x: optionalX, y: optionalY}
	}

	const obj = optionalX as Point

	try {
		return {x: obj.x, y: obj.y}
	} catch (e) {
		throw new Error('Invalid point')
	}
}
