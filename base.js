// let seed = 12345
// let planetSize = 45 // random(30, 170)
// let hasRings = true // random() < 0.5 // 50% chance
// let numMoons = 2 // floor(random(0, 5)) // Up to 3 moons
// let planetType = 0 // 0 = gas, 1 = solid
// let hasAtmosphere = true // random() < 0.5 // 50% chance
// let colors = []

let angle = 0
let textureImg
let initialRotationX
let initialRotationY
let ringSize
let numRingParticles
let atmosphereColor
let stars = []
let rings = []
let moons = []
let moonTextures = []

function setup() {
  randomSeed(seed)
  createCanvas(500, 500, WEBGL)
  let numColors = 5
  let randomPalette = []
  // TODO: Color palette generated in solidity
  for (let i = 0; i < numColors; i++) {
    randomPalette.push(color(random(255), random(255), random(255)))
  }
  let thresholds = []
  for (let i = 0; i < numColors - 1; i++) {
    thresholds.push(random())
  }
  thresholds.sort()
  let randomColorPalette = {
    thresholds: thresholds,
    colors: randomPalette,
  }

  // Generate stars
  for (let i = 0; i < 1000; i++) {
    stars.push({
      x: random(-width * 5, width * 5),
      y: random(-height * 5, height * 5),
      z: random(width * 5),
      radius: random(0.5, 2),
    })
  }

  initialRotationX = random(360)
  initialRotationY = 148

  textureImg = generateTexture(randomColorPalette.thresholds, randomColorPalette.colors, planetType)

  // Determine if the planet should have rings

  if (hasRings) {
    numRingParticles = random(400, 1500)
    ringSize = random(planetSize * 1.5, planetSize * 2)
    // Generate particles for the rings
    for (let i = 0; i < numRingParticles; i++) {
      let theta = random(TWO_PI)
      let ringRadius = random(ringSize * 0.7, Math.max(ringSize, 80))
      rings.push({
        x: ringRadius * cos(theta),
        y: ringRadius * sin(theta),
        z: random(-5, 5),
        radius: random(0.1, 2),
      })
    }
  }

  // Generate moons

  for (let i = 0; i < numMoons; i++) {
    let moonRadius = random(planetSize * 0.05, planetSize * 0.21)

    let minMoonDistance = hasRings ? ringSize * 1.2 : planetSize * 1.5 // Change minimum distance based on presence of rings
    let maxMoonDistance = planetSize * 8
    let moonDistance = random(minMoonDistance, maxMoonDistance)

    let randomRingParticle = random(rings) // Get a random ring particle
    let moonAngle = random(TWO_PI) // Change this line to add
    let moonSpeed = random(0.001, 0.011) // Add random speed property
    moonTextures.push(generateMoonTexture())
    let orbitAngle = radians(random(-15, 15))
    moons.push({
      radius: moonRadius,
      distance: moonDistance,
      angle: moonAngle,
      speed: moonSpeed, // Add speed property to moon object
      orbitAngle: orbitAngle, // Add the orbitAngle property to the moon object
    })
  }

  if (hasAtmosphere) {
    let r = random(0, 255)
    let g = random(0, 255)
    let b = random(0, 255)
    let a = random(30, 100) // Adjust the range of transparency as needed
    atmosphereColor = color(r, g, b, a)
  }
}

function generateTexture(elevationThresholds, colors, planetType) {
  let textureImg = createGraphics(1024, 512)
  textureImg.noiseSeed(random(1000))

  let noiseScale = planetType === 0 ? 1 : 4

  for (let x = 0; x < textureImg.width; x++) {
    for (let y = 0; y < textureImg.height; y++) {
      // Convert x and y to spherical coordinates
      let lon = map(x, 0, textureImg.width, 0, TWO_PI)
      let lat = map(y, 0, textureImg.height, -PI / 2, PI / 2)
      let u = (cos(lat) * cos(lon) + 1) / 2
      let v = (cos(lat) * sin(lon) + 1) / 2
      let elevation = textureImg.noise(u * noiseScale, v * noiseScale)
      let col = color(255)
      let found = false
      for (let i = 0; i < elevationThresholds.length; i++) {
        if (elevation < elevationThresholds[i]) {
          col = lerpColor(
            colors[i],
            colors[i + 1],
            (elevation - (i === 0 ? 0 : elevationThresholds[i - 1])) *
              (1 / (elevationThresholds[i] - (i === 0 ? 0 : elevationThresholds[i - 1]))),
          )
          found = true
          break
        }
      }
      if (!found) {
        col = colors[colors.length - 1] // Assign the last color if elevation is greater than the last threshold
      }
      textureImg.set(x, y, col)
      // Choose a random color from the palette for the atmosphere color
      if (hasAtmosphere && x === textureImg.width / 2 && y === textureImg.height / 2) {
        let atmosphereIndex = floor(random(colors.length))
        atmosphereColor = colors[atmosphereIndex]
      }
    }
  }
  textureImg.updatePixels()
  return textureImg
}

function generateMoonTexture() {
  let textureImg = createGraphics(512, 256)
  textureImg.noiseSeed(random(1000))

  for (let x = 0; x < textureImg.width; x++) {
    for (let y = 0; y < textureImg.height; y++) {
      let lon = map(x, 0, textureImg.width, 0, TWO_PI)
      let lat = map(y, 0, textureImg.height, -PI / 2, PI / 2)
      let u = (cos(lat) * cos(lon) + 1) / 2
      let v = (cos(lat) * sin(lon) + 1) / 2
      let elevation = textureImg.noise(u * 4, v * 4)
      let col = color(map(elevation, 0, 1, 20, 255))
      textureImg.set(x, y, col)
    }
  }
  textureImg.updatePixels()
  return textureImg
}
function drawMoon(moon, moonTexture) {
  push()
  texture(moonTexture)
  noStroke()
  rotateX(moon.orbitAngle) // Add this line to apply the orbit angle
  rotateY(moon.angle)
  translate(moon.distance, 0, 0)
  rotateZ(radians(95))
  sphere(moon.radius)
  pop()
}

function drawAtmosphere() {
  push()
  fill(atmosphereColor)
  noStroke()
  sphere(planetSize * 1.05) // Change the size multiplier as needed
  pop()
}

function draw() {
  background(0)
  // Set up ambient light
  ambientLight(100)
  ambientMaterial(0)

  // Set up point light
  pointLight(255, 255, 255, 400, 400, 1200)

  // Draw stars
  push()
  translate(0, 0, -1200)
  for (let star of stars) {
    stroke(255)
    strokeWeight(star.radius)
    point(star.x, star.y, star.z)
  }
  pop()

  // Draw rings if the planet has them
  if (hasRings) {
    let lightPosX = 0
    let lightPosY = -planetSize * 1.5
    let lightPosZ = 0
    let lightPos = createVector(lightPosX, lightPosY, lightPosZ)

    rotateY(initialRotationY + angle)
    rotateX(HALF_PI)
    for (let ringParticle of rings) {
      let particlePos = createVector(ringParticle.x, ringParticle.y, ringParticle.z)
      let rotatedParticlePos = particlePos.copy().rotate(-angle)
      let distToLight = rotatedParticlePos.dist(lightPos)
      let lightEffect = 1 - pow(distToLight / (planetSize * 2), 1.5)
      let particleColor = color(120, 120, 120, 255 * lightEffect)
      stroke(particleColor)
      strokeWeight(ringParticle.radius)
      point(ringParticle.x, ringParticle.y, ringParticle.z)
    }
  }

  let fixedDistance = 450
  let maxAngle = radians(10)
  let mouseXRatio = map(mouseX, 0, width, -maxAngle, maxAngle)
  let mouseYRatio = map(mouseY, 0, height, -maxAngle, maxAngle)
  let camX = 400 * sin(mouseYRatio)
  let camY = -100 * cos(mouseXRatio)
  let camZ = 400
  camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0)

  // Rotate planet
  push() // Add push() to isolate the rotation transformation
  rotateY(initialRotationY + angle)
  rotateX(initialRotationX + QUARTER_PI)
  rotateZ(QUARTER_PI)
  angle += 0.005

  // Draw planet
  texture(textureImg)
  noStroke()
  sphere(planetSize)
  pop()

  // Draw moons and their orbits
  for (let i = 0; i < numMoons; i++) {
    let moon = moons[i]
    let moonTexture = moonTextures[i]
    push() // Add push() to isolate the moon rotation transformation
    drawMoon(moon, moonTexture)
    pop() // Add pop() to isolate the moon rotation transformation
  }
  // Draw atmosphere if the planet has one
  if (hasAtmosphere) {
    drawAtmosphere()
  }

  // Update moon angles
  for (let moon of moons) {
    moon.angle += moon.speed
  }
}
