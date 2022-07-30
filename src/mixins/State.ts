import {RegionManagerState} from './RegionManager'
import {TileManagerState} from './TileManager'
import {RandomState} from './Random'
import {Region} from '../structures/Region'
import {TileMatrix} from '../structures/Tile'
import {defaultDungeonOptions, DungeonOptions} from '../common'
import {RoomManagerState} from './RoomManager'
import {BuilderState, StageOptions} from './Builder'

export interface DungeonState extends BuilderState, RandomState, RegionManagerState, RoomManagerState, TileManagerState {}

export class State {
	protected state = {} as DungeonState
	options: DungeonOptions

	constructor(options?: DungeonOptions) {
		this.options = {...defaultDungeonOptions, ...options}
		this.options.multiplier = this.options.multiplier > 0 ? parseInt(String(this.options.multiplier || 1)) || 1 : 1
	}

	get region(): Region {
		return this.state.region
	}

	get regions(): Record<number, Region> {
		return this.state.regions
	}

	get currentRegion(): number {
		return this.region.id
	}

	get tiles(): TileMatrix {
		return this.state.tiles
	}

	get stage(): StageOptions {
		return this.state.stage
	}
}

export function safeMerge<T = any>(state, defaultState): T {
	return {...defaultState, ...state || {}} as T
}
