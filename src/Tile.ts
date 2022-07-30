import {Coordinates, parsePoint} from './Coordinates'
import {Query} from './Query'
import {RegionType} from './Region'

export type TileType = 'door' | 'floor' | 'wall'

export type TileMatrix = Tile[][]

export interface Neighbors {
	n?: Tile
	ne?: Tile
	e?: Tile
	se?: Tile
	s?: Tile
	sw?: Tile
	w?: Tile
	nw?: Tile
}

// todo: convert region to an array of Region objects. Most will contain only 1 region, but doors will have 2.
export interface TileState {
	type: TileType
	name?: string
	neighbors: Neighbors
	x: number
	y: number
	region: number
	regionType?: RegionType
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

	get name(): string {
		return `${this.state.x}x${this.state.y}${this.state.name ? ` (${this.state.name})` : ''}`
	}

	set name(name: string) {
		this.state.name = name
	}

	get x(): number {
		return parseInt(String(this.state.x))
	}

	get y(): number {
		return parseInt(String(this.state.y))
	}

	get type(): TileType {
		return this.state.type
	}

	set type(type: TileType) {
		this.state.type = type
	}

	get region(): number {
		return this.state.region
	}

	set region(region: number) {
		this.state.region = parseInt(String(region))
	}

	get regionType(): RegionType {
		return this.state.regionType
	}

	set regionType(type: RegionType) {
		this.state.regionType = type
	}

	get neighbors(): Neighbors {
		return this.state.neighbors
	}

	set neighbors(neighbors: Neighbors) {
		this.state.neighbors = neighbors
	}

	setNeighbors(neighbors: Neighbors) {
		this.state.neighbors = neighbors
		return this
	}

	getNeighbors(): Tile[] {
		return Object.values(this.neighbors)
	}

	getNeighbor(direction: string): Tile | undefined {
		return this.neighbors[direction]
	}

	find(): Query {
		const tiles = Object.values(this.neighbors)
		tiles.push(this)
		return new Query(tiles, {
			start: {
				x: this.state.x,
				y: this.state.y
			}
		})
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

	isCardinal(tile: Tile): boolean {
		return this.neighbors.n === tile.neighbors.s ||
			this.neighbors.s === tile.neighbors.n ||
			this.neighbors.e === tile.neighbors.w ||
			this.neighbors.w === tile.neighbors.e
	}

	isIntercardinal(tile: Tile): boolean {
		return this.neighbors.ne === tile.neighbors.sw ||
			this.neighbors.nw === tile.neighbors.se ||
			this.neighbors.se === tile.neighbors.nw ||
			this.neighbors.sw === tile.neighbors.ne
	}

	offset(x: number, y: number): this
	offset(location: Coordinates): this
	offset(optionalX: Coordinates | number, optionalY?: number): this {
		const {x, y} = parsePoint(optionalX, optionalY)
		this.state.x += x
		this.state.y += y
		return this
	}

	isFloor(): boolean {
		return this.type === 'floor'
	}

	isDoor(): boolean {
		return this.type === 'door'
	}

	inRegion(region: number | string): boolean {
		return this.region === parseInt(String(region))
	}

	isWall(): boolean {
		return this.type === 'wall'
	}

	isRoom(): boolean {
		return this.state.regionType === 'room'
	}

	isCorridor(): boolean {
		return this.state.regionType === 'corridor'
	}

	toJSON() {
		const {x, y, type, region} = this.state
		return {x, y, type, region}
	}

	toString() {
		return `${this.state.x},${this.state.y}`
	}

	async nearDoors(levels = 1): Promise<boolean> {
		return (await this.doors(levels)).length > 0
	}

	async touchesAnother(): Promise<boolean> {
		return (await this.around()).some(tile => tile.isFloor() && tile.region === -1 || tile.region !== this.region)
	}

	async isAtEnd(): Promise<boolean> {
		return (await this.floors()).length === 1
	}

	async nearRoom(levels = 1): Promise<boolean> {
		return (await this.find().levels(levels).type('floor').regionType('room').notRegion(this.region).get()).length > 0
	}

	async doors(levels = 1): Promise<Tile[]> {
		return await this.find().levels(levels).type('door').get()
	}

	async walls(levels = 1): Promise<Tile[]> {
		return await this.find().levels(levels).type('wall').get()
	}

	async floors(levels = 1): Promise<Tile[]> {
		return await this.find().levels(levels).type('floor').get()
	}

	async cardinal(levels = 1): Promise<Tile[]> {
		return await this.find().levels(levels).cardinal().get()
	}

	async intercardinal(levels = 1): Promise<Tile[]> {
		return await this.find().levels(levels).intercardinal().get()
	}

	async around(levels = 1): Promise<Tile[]> {
		return await this.find().levels(levels).get()
	}
}

export default Tile
