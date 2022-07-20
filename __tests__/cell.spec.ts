import Cell from '../src/Cell'

describe('Cell', () => {
	const point = {x: 2, y: 10}
	const offset = {x: 1, y: 1}

	it('Cell should be a constructor', () => {
		expect(Cell).toBeInstanceOf(Function)
	})

	it('Cell objects should be able to be created with number arguments', () => {
		expect(() => {
			new Cell(2, 10)
		}).not.toThrow()
	})

	it('Cell objects should be able to be created with Point objects', () => {
		expect(() => {
			new Cell(point)
		}).not.toThrow()
	})

	it('Cell objects should contain an x property', () => {
		expect(new Cell(point).x).toBe(2)
	})

	it('Cell objects should contain an y property', () => {
		expect(new Cell(point).y).toBe(10)
	})

	it('Cell.offset() should accept 2 numbers as arguments', () => {
		expect(() => {
			new Cell(point).offset(1, 1)
		}).not.toThrow()
	})

	it('Cell.offset() should accept an object with x and y properties as a single argument', () => {
		expect(() => {
			new Cell(point).offset(offset)
		}).not.toThrow()
	})

	it('Cell.offset() should increment the x and y', () => {
		expect(new Cell(point).offset(offset).toJson()).toStrictEqual({x: 3, y: 11})
	})

	it('Cell.offset() chains should increment multiple times', () => {
		expect(new Cell(point).offset(offset).offset(offset).offset(offset).toJson()).toStrictEqual({x: 5, y: 13})
	})
})
