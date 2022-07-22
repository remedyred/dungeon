export type RegionType = 'corridor' | 'room'

export interface RegionState {
	type: RegionType
	id: number
}

export class Region {
	private readonly state: RegionState

	static _id = 0

	constructor(type?: RegionType, id: number = Region._id++) {
		this.state = {
			type,
			id
		}
	}

	get id() {
		return this.state.id
	}

	get type() {
		return this.state.type
	}

	toJSON() {
		return {...this.state}
	}
}
