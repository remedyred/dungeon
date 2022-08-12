export type RegionType = 'corridor' | 'room'

export const regionTypes = ['corridor', 'room']

export interface RegionState {
	type: RegionType
	id: number
}

export class Region {
	private readonly state: RegionState

	constructor(type?: RegionType, id = -1) {
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
