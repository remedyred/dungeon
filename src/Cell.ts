import {Coordinates, parsePoint} from './Coordinates'

export interface CellState {
	x: number
	y: number
}

export class Cell {
	private readonly state: CellState

	constructor(x: number, y: number)
	constructor(coordinates: Coordinates)
	constructor(optionalX: Coordinates | number, optionalY?: number) {
		const {x, y} = parsePoint(optionalX, optionalY)

		this.state = {
			x,
			y
		}
	}

	get x() {
		return this.state.x
	}

	set x(x: number) {
		this.state.x = x
	}

	get y() {
		return this.state.y
	}

	set y(y: number) {
		this.state.y = y
	}

	get(direction: 'x' | 'y') {
		return this.state[direction]
	}

	set(x: number, y: number): this
	set(location: Coordinates): this
	set(args: Coordinates | number, optionalY?: number): this {
		const {x, y} = parsePoint(args, optionalY)
		this.state.x = x
		this.state.y = y
		return this
	}

	offset(x: number, y: number): this
	offset(location: Coordinates): this
	offset(args: Coordinates | number, optionalY?: number): this {
		const {x, y} = parsePoint(args, optionalY)
		this.state.x += x
		this.state.y += y
		return this
	}

	clone() {
		return new Cell(this.state.x, this.state.y)
	}

	toJson() {
		return {...this.state}
	}

	toString() {
		return `${this.state.x},${this.state.y}`
	}
}

export default Cell
