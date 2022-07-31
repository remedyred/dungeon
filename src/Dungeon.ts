import {isBrowser} from 'browser-or-node'
import {DungeonOptions} from './common'
import {Builder, Carver, CorridorManager, Random, RegionManager, RoomManager, State, TileManager, Walker} from './mixins'
import {Mixin, settings} from 'ts-mixer'

settings.initFunction = 'init'

export class Dungeon extends Mixin(
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

export function dungeon(options?: DungeonOptions): Dungeon {
	return new Dungeon(options)
}

if (isBrowser) {
	window.dungeon = dungeon
}

