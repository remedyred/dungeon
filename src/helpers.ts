import Chance from 'chance'

export const nameChance = new Chance()

export const defaultDungeonOptions = {
	extraConnectorChance: 50,
	maxConnectors: 5,
	roomTries: 50,
	roomExtraSize: 0,
	windingPercent: 50
}

export const defaultStageOptions = {
	width: 5,
	height: 5,
	seed: nameChance.guid()
}
