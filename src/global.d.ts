import {createBuilder} from './DungeonBuilder'

declare global {
	interface Window {
		createBuilder: typeof createBuilder
	}
}
