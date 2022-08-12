import {isBrowser} from 'browser-or-node'
import {DungeonOptions} from './common'
import {Builder, Carver, CorridorManager, Random, RegionManager, RoomManager, State, TileManager, Walker} from './mixins'
import {Mixin, settings} from 'ts-mixer'

settings.initFunction = 'init'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DungeonBuilder extends State {}

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
) {
	constructor(options?: DungeonOptions) {
		super(options)
		this.initialized()
	}
}

export function createBuilder(options?: DungeonOptions): DungeonBuilder {
	return new DungeonBuilder(options)
}

if (isBrowser) {
	window.createBuilder = createBuilder
}

