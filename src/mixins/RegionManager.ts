import {DungeonState, safeMerge, State} from './State'
import {Region, RegionType} from '../structures/Region'
import {TileManager} from './TileManager'
import Tile from '../structures/Tile'

export interface RegionManagerState {
	regions: Record<number, Region>
	region?: Region
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RegionManager extends State, TileManager {}

const default_state: RegionManagerState = {regions: {}}

export class RegionManager {
	init() {
		this.state = safeMerge<DungeonState>(this.state, default_state)
	}

	protected startRegion(type?: RegionType, id?: number): Region {
		const region = new Region(type, id)
		this.regions[region.id] = region
		this.state.region = region
		return region
	}

	getRegions(): Record<number, Tile[]> {
		const regions: Record<number, Tile[]> = {}

		for (let tile of this.tiles.flat()) {
			if (!regions[tile.region]) {
				regions[tile.region] = []
			}
			regions[tile.region].push(tile)
		}

		return regions
	}
}
