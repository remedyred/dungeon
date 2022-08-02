import {isBrowser} from 'browser-or-node'
import {DungeonOptions} from './common'
import {Builder, Carver, CorridorManager, Random, RegionManager, RoomManager, State, TileManager, Walker} from './mixins'
import {Mixin, settings} from 'ts-mixer'

settings.initFunction = 'init'

export class DungeonBuilder extends Mixin(
	Builder,
	Carver,
	CorridorManager,
	Random,
	RegionManager,
	RoomManager,
	State,
	TileManager,
	Walker
) {}

export function createBuilder(options?: DungeonOptions): DungeonBuilder {
	return new DungeonBuilder(options)
}

if (isBrowser) {
	window.createBuilder = createBuilder
}

