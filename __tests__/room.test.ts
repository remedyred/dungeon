import {Room} from '../src/Room'

it('Room objects should contain an x property', () => {
	expect(new Room(2, 2, 10, 10).x).toBe(2)
})

it('Room objects should contain an y property', () => {
	expect(new Room(2, 2, 10, 10).x).toBe(2)
})

it('Room objects should contain a width property', () => {
	expect(new Room(2, 2, 10, 10).width).toBe(10)
})

it('Room objects should contain a height property', () => {
	expect(new Room(2, 2, 10, 10).height).toBe(10)
})

it('Room.containsTile() returns false for tiles north of the room', () => {
	const room = new Room(0, 0, 10, 10)

	expect(room.containsTile(0, -1)).toBe(false)
})

it('Room.containsTile() returns false for tiles east of the room', () => {
	const room = new Room(0, 0, 10, 10)

	expect(room.containsTile(11, 0)).toBe(false)
})

it('Room.containsTile() returns false for tiles south of the room', () => {
	const room = new Room(0, 0, 10, 10)

	expect(room.containsTile(0, 11)).toBe(false)
})

it('Room.containsTile() returns false for tiles west of the room', () => {
	const room = new Room(0, 0, 10, 10)

	expect(room.containsTile(-1, 0)).toBe(false)
})

it('Room.containsTile() returns true for tiles inside of the room', () => {
	const room = new Room(0, 0, 3, 3)

	expect(room.containsTile(0, 2)).toBe(true)
	expect(room.containsTile(1, 2)).toBe(true)
	expect(room.containsTile(2, 2)).toBe(true)

	expect(room.containsTile(0, 1)).toBe(true)
	expect(room.containsTile(1, 1)).toBe(true)
	expect(room.containsTile(2, 1)).toBe(true)

	expect(room.containsTile(0, 0)).toBe(true)
	expect(room.containsTile(1, 0)).toBe(true)
	expect(room.containsTile(2, 0)).toBe(true)
})

it('Room.intersects() Should throw if the object has no getBoundingBox method', () => {
	expect(() => {
		new Room(0, 0, 3, 3).intersects({foo: 'bar'})
	}).toThrow()
})

it('Room.intersects() returns false for rooms north of the room', () => {
	const room1 = new Room(0, 10, 10, 10)
	const room2 = new Room(0, 0, 10, 10)

	expect(room1.intersects(room2)).toBe(false)
})

it('Room.intersects() returns false for rooms east of the room', () => {
	const room1 = new Room(0, 0, 10, 10)
	const room2 = new Room(10, 0, 10, 10)

	expect(room1.intersects(room2)).toBe(false)
})

it('Room.intersects() returns false for rooms south of the room', () => {
	const room1 = new Room(0, 0, 10, 10)
	const room2 = new Room(0, 10, 10, 10)

	expect(room1.intersects(room2)).toBe(false)
})

it('Room.intersects() returns false for rooms west of the room', () => {
	const room1 = new Room(10, 0, 10, 10)
	const room2 = new Room(0, 0, 10, 10)

	expect(room1.intersects(room2)).toBe(false)
})

it('Room.intersects() returns true for rooms that intersect', () => {
	const room = new Room(10, 10, 10, 10)

	expect(room.intersects(new Room(1, 1, 10, 10))).toBe(true)
	expect(room.intersects(new Room(9, 9, 10, 10))).toBe(true)
	expect(room.intersects(new Room(10, 10, 10, 10))).toBe(true)
	expect(room.intersects(new Room(19, 19, 10, 10))).toBe(true)
})

it('Room.getBoundingBox() returns the correct bounding box', () => {
	expect(new Room(0, 0, 10, 10).getBoundingBox()).toEqual({
		top: 0,
		right: 9,
		bottom: 9,
		left: 0
	})

	expect(new Room(3, 3, 3, 3).getBoundingBox()).toEqual({
		top: 3,
		right: 5,
		bottom: 5,
		left: 3
	})
})

it('Room.toJson() should return a POJO', () => {
	expect(new Room(0, 0, 10, 10).toJson()).toEqual({
		x: 0,
		y: 0,
		width: 10,
		height: 10
	})
})
