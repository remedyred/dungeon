import {Neighbors} from './Dungeon'
import {NeighborQuery} from './NeighborQuery'

export type TileType = 'door' | 'floor' | 'shaft' | 'stairs' | 'wall'

export interface TileState {
	type: TileType
	neighbors: Neighbors
	x: number
	y: number
	region: number
}

export class Tile {
	private readonly state: TileState

	constructor(type: TileType, x: number, y: number, region = -1) {
		this.state = {
			type,
			neighbors: {},
			x,
			y,
			region
		}
	}

	get x() {
		return this.state.x
	}

	get y() {
		return this.state.y
	}

	get type() {
		return this.state.type
	}

	set type(type: TileType) {
		this.state.type = type
	}

	get region() {
		return this.state.region
	}

	set region(region: number) {
		this.state.region = region
	}

	get neighbors() {
		return this.state.neighbors
	}

	set neighbors(neighbors: Neighbors) {
		this.state.neighbors = neighbors
	}

	setNeighbors(neighbors: Neighbors) {
		this.state.neighbors = neighbors
		return this
	}

	getNeighbors() {
		return this.neighbors
	}

	find() {
		return new NeighborQuery(this)
	}

	cardinal(levels = 1): Tile[] {
		return this.find().levels(levels).cardinal().get()
	}

	intercardinal(levels = 1): Tile[] {
		return this.find().levels(levels).intercardinal().get()
	}

	isCorner(): boolean {
		let corners = 0

		if (this.neighbors.n?.isFloor() && this.neighbors.e?.isFloor()) {
			corners++
		}

		if (this.neighbors.n?.isFloor() && this.neighbors.w?.isFloor()) {
			corners++
		}

		if (this.neighbors.s?.isFloor() && this.neighbors.e?.isFloor()) {
			corners++
		}

		if (this.neighbors.s?.isFloor() && this.neighbors.w?.isFloor()) {
			corners++
		}

		return corners === 1
	}

	nearDoors(levels = 1): boolean {
		return this.doors(levels).length > 0
	}

	floors(levels = 1): Tile[] {
		return this.find().levels(levels).type('floor').get()
	}

	doors(levels = 1): Tile[] {
		return this.find().levels(levels).type('door').get()
	}

	walls(levels = 1): Tile[] {
		return this.find().levels(levels).type('wall').get()
	}

	isFloor(): boolean {
		return this.type === 'floor'
	}

	isDoor(): boolean {
		return this.type === 'door'
	}

	isWall(): boolean {
		return this.type === 'wall'
	}

	isAtEnd(): boolean {
		return this.floors().length === 1
	}

	toJson() {
		const {x, y, type} = this.state
		return {x, y, type}
	}

	toString() {
		return `${this.state.x},${this.state.y}`
	}
}

export default Tile
