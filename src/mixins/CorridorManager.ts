import {State} from './State'
import {Corridor} from '../structures/Corridor'
import {TileManager} from './TileManager'
import {Walker} from './Walker'
import {RegionManager} from './RegionManager'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CorridorManager extends State, TileManager, Walker, RegionManager {}

export type CorridorStrategy = 'maze' | 'prim' | 'room'

export class CorridorManager {
	protected getCorridors(): Corridor[] {
		const corridorTiles = this.find().regionType('corridor').get()
		const corridors: Record<number, Corridor> = {}

		for (const tile of corridorTiles) {
			if (!corridors[tile.region]) {
				corridors[tile.region] = new Corridor(tile.region, [])
			}
			corridors[tile.region].push(tile)
		}

		return Object.values(corridors)
	}
}
