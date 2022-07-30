import {Region, RegionType} from './structures/Region'
import {Results} from './Results'
import {defaultStageOptions, StageOptions} from './common'
import {isString, slugify} from '@snickbit/utilities'
import {$chance} from './random/chance'
import {TileMatrix} from './structures/Tile'
import Room from './structures/Room'

export interface DungeonState {
	tiles: TileMatrix
	regions: Record<number, Region>
	results?: Results
	region?: Region
	stage: StageOptions
	seed?: any
	rooms: Room[]
}

export const default_state: DungeonState = {
	rooms: [],
	regions: {},
	tiles: [],
	stage: {...defaultStageOptions}
}

export class State {
	protected state: DungeonState

	constructor(options: Partial<DungeonState> = {}) {
		this.state = {...default_state, ...options} as DungeonState
	}

	get region(): Region {
		return this.state.region
	}

	get regions(): Record<number, Region> {
		return this.state.regions
	}

	get tiles(): TileMatrix {
		return this.state.tiles
	}

	get rooms(): Room[] {
		return this.state.rooms
	}

	get currentRegion(): number {
		return this.region.id
	}

	get seed(): any {
		return this.state.seed
	}

	set seed(seed: any) {
		if (!/[a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+/.test(String(seed))) {
			if (isString(seed)) {
				seed = slugify(seed)
			} else {
				// if seed is not a string, generate a string seed
				const seedChance = $chance.clone(seed)
				seed = seedChance.generateSlug()
			}
		}
		this.state.seed = seed
	}

	protected startRegion(type?: RegionType, id?: number): Region {
		const region = new Region(type, id)
		this.regions[region.id] = region
		this.state.region = region
		return region
	}
}
