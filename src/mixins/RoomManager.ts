import {DungeonState, safeMerge, State} from './State'
import {Room} from '../structures/Room'

export interface RoomManagerState {
	rooms: Room[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RoomManager extends State {}

const default_state: RoomManagerState = {rooms: []}

export class RoomManager {
	init() {
		this.state = safeMerge<DungeonState>(this.state, default_state)
	}

	get rooms(): Room[] {
		return this.state.rooms
	}
}
