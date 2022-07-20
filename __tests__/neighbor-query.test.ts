import {NeighborQuery, Tile} from '../src'

describe('NeighborQuery', () => {
	let tile: Tile
	let n: Tile
	let e: Tile
	let s: Tile
	let w: Tile
	let ne: Tile
	let se: Tile
	let sw: Tile
	let nw: Tile

	beforeEach(() => {
		tile = new Tile('floor', 2, 10, -1)
		n = new Tile('floor', 2, 11, -1)
		e = new Tile('floor', 3, 10, -1)
		s = new Tile('wall', 2, 9, -1)
		w = new Tile('wall', 1, 10, -1)
		ne = new Tile('wall', 3, 11, -1)
		se = new Tile('wall', 3, 9, -1)
		sw = new Tile('floor', 1, 9, -1)
		nw = new Tile('floor', 1, 11, -1)
		tile.setNeighbors({n, e, s, w, ne, se, sw, nw})
	})

	it('.get() should return an array of tiles', () => {
		const query = new NeighborQuery(tile)
		expect(query.get()).toEqual([
			n,
			e,
			s,
			w,
			ne,
			se,
			sw,
			nw
		])
	})

	it('.cardinal().get() should return only cardinal neighbors', () => {
		const query = new NeighborQuery(tile)
		expect(query.cardinal().get()).toEqual([
			n,
			e,
			s,
			w
		])
	})

	it('.intercardinal().get() should return only intercardinal neighbors', () => {
		const query = new NeighborQuery(tile)
		expect(query.intercardinal().get()).toStrictEqual([
			ne,
			se,
			sw,
			nw
		])
	})

	it('.type().get() should return only the selected type', () => {
		const query = new NeighborQuery(tile)
		expect(query.type('floor').get()).toStrictEqual([
			n,
			e,
			sw,
			nw
		])
	})

	it('.notType().get() should return everything except the selected type', () => {
		const query = new NeighborQuery(tile)
		expect(query.notType('floor').get()).toStrictEqual([
			s,
			w,
			ne,
			se
		])
	})
})
