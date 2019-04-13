
class Updatable {
  constructor () {
    this.lastRequestAnimationFrame = window.requestAnimationFrame(this.update.bind(this))
  }
  update () {
    this.lastRequestAnimationFrame = window.requestAnimationFrame(this.update.bind(this))
  }
  destroy () {
    window.cancelAnimationFrame(this.lastRequestAnimationFrame)
  }
}

class Substance extends Updatable {
  constructor (game, x, y, size) {
    super()
    Object.assign(this, { game, x, y, size })
    game.append(this)
  }
  appendDivToGame (className) {
    const element = document.createElement('div')
    element.classList.add(className)
    this.game.element.append(element)
    return element
  }
  destroy () {
    super.destroy()
    if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element)
    this.game.remove(this)
  }
  touchWith (substance) {
    if (Math.abs(this.centerX - substance.centerX) > (this.size + substance.size) / 2) return false
    if (Math.abs(this.centerY - substance.centerY) > (this.size + substance.size) / 2) return false
    return true
  }
  get centerX () {
    return this.x + (this.size / 2)
  }
  get centerY () {
    return this.y + (this.size / 2)
  }
  get outOfScreen () {
    if (this.x < (window.scrollX - this.size)) return true
    if (this.y < (window.scrollY - this.size)) return true
    if (this.x > (window.scrollX + window.innerWidth - 20)) return true
    if (this.y > (window.scrollY + window.innerHeight)) return true
    return false
  }
}

class Player extends Substance {
  constructor (game, x, y) {
    super(game, x, y, 32)
    Object.assign(this, {
      element: this.appendDivToGame('player'),
      forceX: 0,
      forceY: 0,
      direction: 1,
      gunDelay: 0
    })
  }
  update () {
    super.update()
    this.updateDelay()
    this.updateStyle()
    this.updatePysics()
    this.landingBottom()
  }
  registerElements (elements) {
    this.elements = elements
  }
  updateDelay () {
    if (this.gunDelay) this.gunDelay--
  }
  updatePysics () {
    this.x += this.forceX
    this.forceX = 0
    this.y += this.forceY
    this.forceY = Math.min(this.forceY + 2, 8)
  }
  updateStyle () {
    this.element.classList[this.forceX !== 0 ? 'add' : 'remove']('walk')
    this.element.classList[this.forceY < 0 ? 'add' : 'remove']('jump')
    this.element.classList[this.direction === -1 ? 'add' : 'remove']('left')
    this.element.style.left = `${this.x}px`
    this.element.style.top = `${this.y}px`
  }
  gun () {
    if (this.gunDelay) return
    this.gunDelay = 10
    new Bullet(this.game, this.x + this.direction * 10, this.y + 20, this.direction)
  }
  jump () {
    if (this.jumpCount < 2 && this.forceY >= 0) {
      this.jumpCount++
      this.forceY = -30
    }
  }
  walk (add) {
    this.direction = (add ? 1 : -1)
    const speed = 5
    this.forceX = this.direction * speed
  }
  landingBottom () {
    if ((this.y + this.size - 10) >= (window.scrollY + window.innerHeight)) {
      this.game.gameOver()
    }
  }
  landingTo (elements) {
    const collides = elements.some(v => {
      if (Math.abs((this.x + (this.size / 2)) - (v.x + window.scrollX + (v.width / 2))) > ((this.size / 2) + (v.width / 2))) return false
      const yDiff = ((this.y + this.forceY + this.size) - (v.y + window.scrollY))
      const landing = yDiff >= -3 && yDiff < this.forceY
      if (landing) v.land(this)
      return landing
    })
    if (collides) this.onLanding()
  }
  onLanding () {
    this.forceY = 0
    this.jumpCount = 0
  }
}

class Balloon extends Substance {
  constructor (game, x, y) {
    super(game, x, y, 32)
    Object.assign(this, {
      element: this.appendDivToGame('balloon')
    })
    this.initializeStyle()
  }
  update () {
    super.update()
    this.updateStyle()
    this.updatePysics()
    if (this.outOfScreen) {
      this.destroy()
      this.game.gameOver()
    }
  }
  updatePysics () {
    this.y -= 1
  }
  initializeStyle () {
    this.element.style.left = `${this.x}px`
    this.updateStyle()
  }
  updateStyle () {
    this.element.style.top = `${this.y}px`
  }
  brust () {
    this.element.classList.add('brust')
    setTimeout(this.destroy.bind(this), 100)
  }
}

class Bullet extends Substance {
  constructor (game, x, y, direction) {
    super(game, x, y, 10)
    Object.assign(this, {
      element: this.appendDivToGame('bullet'),
      direction
    })
    this.initializeStyle()
  }
  update () {
    super.update()
    this.updateStyle()
    this.updatePysics()
    this.checkHitWithBalloons()
    if (this.outOfScreen) this.destroy()
  }
  updatePysics () {
    this.x += 15 * this.direction
  }
  initializeStyle () {
    if (this.direction === -1) this.element.classList.add('negative')
    this.element.style.top = `${this.y}px`
    this.updateStyle()
  }
  updateStyle () {
    this.element.style.left = `${this.x}px`
  }
  checkHitWithBalloons () {
    const hit = this.game.balloons.some(balloon => {
      if (this.touchWith(balloon)) {
        balloon.brust()
        this.game.addScore()
        return true
      }
      return false
    })
    if (hit) this.destroy()
  }
}

class Floor extends Updatable {
  constructor (element) {
    super()
    const rect = element.getBoundingClientRect()
    Object.assign(this, {
      relativeX: 0,
      relativeY: 0,
      width: rect.width,
      height: rect.height,
      landing: false,
      element
    })
    element.classList.add('collides')
    element.style.position = 'relative'
  }
  update () {
    super.update()
    if (!this.landing && this.relativeY > 0) {
      this.relativeY -= 2
    }
    this.element.style.left = `${this.relativeX}px`
    this.element.style.top = `${this.relativeY}px`
    this.landing = false
  }
  destroy () {
    super.destroy()
    this.element.classList.remove('collides')
  }
  land (substance) {
    this.landing = true
    this.relativeY += this.weight
    substance.y += this.weight
  }
  get x () {
    return this.element.getBoundingClientRect().left
  }
  get y () {
    return this.element.getBoundingClientRect().top
  }
  get weight () {
    const w = this.width * this.height
    if (w < 10000) return 1.5
    if (w < 100000) return 1
    return 0.5
  }
}

class Controller {
  constructor () {
    this.keys = [
      { name: 'JUMP', code: 88 },
      { name: 'GUN', code: 90 },
      { name: 'LEFT', code: 37 },
      { name: 'UP', code: 38 },
      { name: 'RIGHT', code: 39 },
      { name: 'DOWN', code: 40 }
    ]
    this.keys.forEach(k  => {
      this[k.name] = false
    })
    this.avalilableKeys = this.keys.map(k => k.code)
    document.onkeydown = e => this.onKeyUpdate(e, true)
    document.onkeyup = e => this.onKeyUpdate(e, false)
  }
  onKeyUpdate (e, bool) {
    const key = this.keys.find(k => k.code === e.keyCode)
    if (!key) return
    e.preventDefault()
    this[key.name] = bool
  }
}

class Game extends Updatable {
  constructor () {
    super()
    this.element = this.initializeGameElement()
    Object.assign(this, {
      frame: 0,
      controller: new Controller(),
      floors: this.ditectFloors(),
      player: null,
      children: [],
      finished: false,
      closed: false,
      score: 0,
      scoreBoard: this.initializeScoreBoard()
    })
    this.player = new Player(this, window.innerWidth / 2, window.scrollY + 100)
    this.updateScoreBoard()
  }
  update () {
    super.update()
    if (this.finished) return
    this.frame++
    this.controlPlayer()
    this.addBalloon()
  }
  initializeGameElement () {
    const gameElement = document.createElement('div')
    gameElement.setAttribute('id', 'stgOnHtml')
    document.body.append(gameElement)
    return gameElement
  }
  initializeScoreBoard () {
    const scoreBoard = document.createElement('div')
    scoreBoard.classList.add('scoreBoard')
    this.element.append(scoreBoard)
    return scoreBoard
  }
  append (substance) {
    this.children.push(substance)
  }
  remove (substance) {
    this.children = this.children.filter(s => s !== substance)
  }
  ditectFloors () {
    return [...document.querySelectorAll('div, li, h1, h2, h3, img, table, section, article, button, form')].filter(v => {
      const rect = v.getBoundingClientRect()
      const style = getComputedStyle(v)
      if ((rect.width * rect.height) === 0 || style.display === 'none' || style.position === 'absolute') return false
      if (['IMG', 'H1', 'H2', 'H3'].includes(v.tagName)) return true
      return !style.background.startsWith('rgba(0, 0, 0, 0)') || !style.border.startsWith('0px')
    }).filter((_, i) => i < 50).map(element => new Floor(element))
  }
  controlPlayer () {
    if (this.controller.GUN) this.player.gun()
    if (this.controller.JUMP) this.player.jump()
    if (this.controller.LEFT) this.player.walk(false)
    if (this.controller.RIGHT) this.player.walk(true)
    if (!this.controller.DOWN) this.player.landingTo(this.floors)
  }
  addBalloon () {
    if (Math.round(Math.random() * 300) > this.level) return
    new Balloon(this, Math.round(Math.random() * (window.innerWidth - 80)) + 40, window.scrollY + window.innerHeight - 40)
  }
  addScore () {
    this.score += 100
    this.updateScoreBoard()
  }
  updateScoreBoard () {
    this.scoreBoard.innerHTML = `Score: ${this.score}`
    this.scoreBoard.append(document.createElement('br'))
    const explanation = document.createElement('span')
    explanation.innerHTML = '- [←→] Walk - [↓] Get down - [Z] Shot - [X] Jump'
    this.scoreBoard.append(explanation)
  }
  gameOver () {
    this.finished = true
    this.children.forEach(v => v.destroy())
    this.floors.forEach(v => v.destroy())
    this.resolveScoreBoard()
  }
  resolveScoreBoard () {
    this.scoreBoard.classList.add('result')
    this.scoreBoard.innerHTML = `Game Over! - Result Score: ${this.score}`
    this.scoreBoard.append(document.createElement('br'))
    const link = document.createElement('a')
    link.href = this.shareLink
    link.target = '_blank'
    link.innerHTML = '- Share on Twitter'
    this.scoreBoard.append(link)
    this.scoreBoard.append(document.createElement('br'))
    const exit = document.createElement('a')
    exit.href = '#'
    exit.innerHTML = '- Close'
    exit.onclick = () => {
      this.element.parentElement.removeChild(this.element)
      this.closed = true
    }
    this.scoreBoard.append(exit)
  }
  get shareLink () {
    const url = 'https://chrome.google.com/webstore/detail/dcfeajpcanlajcbchpppnmgjhcmjneig'
    const text = `I played Shooter on HTML (Score: ${this.score} Stage URL: ${location.href})`
    return `http://twitter.com/share?url=${url}&text=${text}`
  }
  get level () {
    return Math.ceil(this.frame / 1000)
  }
  get balloons () {
    return this.children.filter(s => s.constructor.name === 'Balloon')
  }
}
