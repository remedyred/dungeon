const WIDTH = 51
const HEIGHT = 51

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

ctx.imageSmoothingEnabled = false

const create = function(width, height) {
	const cellSize = 10
	const $generator = window.dungeon().build({
		width,
		height,
		seed: '315d6260-5537-5167-b524-5af69523a590'
	})

	console.log('Generated dungeon', $generator)

	canvas.width = width * cellSize
	canvas.height = height * cellSize

	canvas.style.width = `${width * cellSize}px`
	canvas.style.height = `${height * cellSize}px`

	ctx.fillStyle = 'black'
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

	ctx.fillStyle = 'red'

	for (const room of $generator.rooms) {
		ctx.fillStyle = 'red'
		ctx.fillRect(room.x * cellSize, room.y * cellSize, room.width * cellSize, room.height * cellSize)
	}

	ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'

	for (let x = 0; x < $generator.tiles.length; x++) {
		for (let y = 0; y < $generator.tiles[x].length; y++) {
			if ($generator.tiles[x][y].type === 'floor') {
				ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
				ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
			}
			if ($generator.tiles[x][y].type === 'door') {
				ctx.fillStyle = 'yellow'
				ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
			}
		}
	}

	window.ctx = ctx

	window.border = () => {
		ctx.beginPath()
		ctx.moveTo(0, 0)
		ctx.lineTo(cellSize * width, 0)
		ctx.lineTo(cellSize * width, cellSize * height)
		ctx.lineTo(0, cellSize * height)
		ctx.lineTo(0, 0)
		ctx.strokeStyle = 'white'
		ctx.stroke()
	}

	ctx.fillStyle = 'green'
	ctx.fillRect(5, 3, cellSize, cellSize)

	const $seed = document.getElementById('seed')
	$seed.innerText = $generator.seed
}

document.querySelector('#dice-svg').addEventListener('mousedown', () => {
	document.querySelector('#dice-svg').classList.add('mousedown')
}, false)

document.querySelector('#dice-svg').addEventListener('mouseup', () => {
	document.querySelector('#dice-svg').classList.remove('mousedown')
	create(WIDTH, HEIGHT)
}, false)

create(WIDTH, HEIGHT)

window.create = create
