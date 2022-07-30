import {Point} from '../Coordinates'

export class Room {
	x: number
	y: number
	width: number
	height: number

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}

	getOuterBox(padding = 0) {
		return {
			top: this.y - 1 - padding,
			right: this.x + this.width + padding,
			bottom: this.y + this.height + padding,
			left: this.x - 1 - padding
		}
	}

	getInnerBox(padding = 0) {
		return {
			top: this.y + padding,
			right: this.x + this.width - padding,
			bottom: this.y + this.height - padding,
			left: this.x + padding
		}
	}

	getBoundingBox(padding = 0) {
		return {
			top: this.y - padding,
			right: this.x + this.width - 1 + padding,
			bottom: this.y + this.height - 1 + padding,
			left: this.x - padding
		}
	}

	getBorderPoints(padding = 0): Point[] {
		const tilesTouchingRoom: Point[] = []

		const room = {
			x: this.x - padding,
			y: this.y - padding,
			height: this.height + padding,
			width: this.width + padding
		}

		for (let x = room.x - 1; x <= this.x + room.width; x++) {
			for (let y = room.y - 1; y <= this.y + room.height; y++) {
				if (
					x === room.x - 1 ||
					y === room.y - 1 ||
					x === this.x + room.width ||
					y === this.y + room.height
				) {
					tilesTouchingRoom.push({x, y})
				}
			}
		}
		return tilesTouchingRoom
	}

	intersects(room: Room) {
		const r1 = this.getBoundingBox()
		const r2 = room.getBoundingBox()

		return !(r2.left > r1.right ||
			r2.right < r1.left ||
			r2.top > r1.bottom ||
			r2.bottom < r1.top)
	}

	touches(room: Room, padding = 0) {
		const r1 = this.getBoundingBox(padding)
		const r2 = room.getBoundingBox(padding)

		return !(r2.left - 1 > r1.right ||
			r2.right + 1 < r1.left ||
			r2.top - 1 > r1.bottom ||
			r2.bottom + 1 < r1.top)
	}

	containsTile(x, y) {
		const boundingBox = this.getBoundingBox()
		return !(
			x < boundingBox.left ||
			x > boundingBox.right ||
			y < boundingBox.top ||
			y > boundingBox.bottom
		)
	}

	toJSON() {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height
		}
	}
}

export default Room
