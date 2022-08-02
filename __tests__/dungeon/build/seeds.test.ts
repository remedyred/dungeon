import {createBuilder} from '../../../src'

const $builder = createBuilder()

describe('seeds', () => {
	it('should return a re-usable seed', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height
		})

		const dungeon1 = $builder.toJSON()

		await $builder.build({
			width,
			height,
			seed: dungeon1.seed
		})

		const dungeon2 = $builder.toJSON()

		expect(dungeon1).toStrictEqual(dungeon2)
	})

	it('seeded dungeons should be consistent', async () => {
		const width = 21
		const height = 21
		await $builder.build({
			width,
			height,
			seed: 'snickbit'
		})
		expect($builder.toJSON()).toMatchSnapshot()
	})

	it('should be seedable', async () => {
		const width = 21
		const height = 21

		await $builder.build({
			width,
			height,
			seed: 'snickbit'
		})
		const dungeon1 = $builder.toJSON()

		await $builder.build({
			width,
			height,
			seed: 'snickbit'
		})

		const dungeon2 = $builder.toJSON()

		expect(dungeon1).toStrictEqual(dungeon2)
	})
})
