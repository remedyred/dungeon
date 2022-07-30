import {isBrowser} from 'browser-or-node'
import {DungeonOptions} from './common'
import {Builder, CorridorManager, Random, RegionManager, RoomManager, State, TileManager, Walker} from './mixins'
import {Mixin, settings} from 'ts-mixer'

settings.initFunction = 'init'

export class Dungeon extends Mixin(
	Builder,
	CorridorManager,
	Walker,
	Random,
	RegionManager,
	RoomManager,
	State,
	TileManager
) {}

export function dungeon(options?: DungeonOptions): Dungeon {
	return new Dungeon(options)
}

if (isBrowser) {
	window.dungeon = dungeon
}

