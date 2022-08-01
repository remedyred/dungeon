import {dungeon} from '../../../src'

describe('seeds', () => {
	it('should return a re-usable seed', async () => {
		const width = 21
		const height = 21
		await dungeon().build({
			width,
			height
		})

		const dungeon1 = dungeon().toJSON()

		await dungeon().build({
			width,
			height,
			seed: dungeon1.seed
		})

		const dungeon2 = dungeon().toJSON()

		expect(dungeon1).toStrictEqual(dungeon2)
	})

	it('seeded dungeons should be consistent', async () => {
		const width = 21
		const height = 21
		await dungeon().build({
			width,
			height,
			seed: 'snickbit'
		})
		expect(dungeon().toJSON()).toMatchSnapshot()
	})

	it('should be seedable', async () => {
		const width = 21
		const height = 21

		await dungeon().build({
			width,
			height,
			seed: 'snickbit'
		})
		const dungeon1 = dungeon().toJSON()

		await dungeon().build({
			width,
			height,
			seed: 'snickbit'
		})

		const dungeon2 = dungeon().toJSON()

		expect(dungeon1).toStrictEqual(dungeon2)
	})
})
