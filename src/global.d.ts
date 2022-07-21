import {dungeon} from './Dungeon'

declare global {
	interface Window {
		dungeon: typeof dungeon
	}
}
