function remap(x, inMin, inMax, outMin, outMax) {
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max)
}

class ContinuousDial {
    constructor(obj, minValue, maxValue, minDegree, maxDegree, startValue) {
        this.#obj = obj
        this.#minValue = minValue;
        this.#maxValue = maxValue;
        this.#minDegree = minDegree;
        this.#maxDegree = maxDegree;

        this.#getImage().ondragstart = function() { return false; };

        this.#obj.addEventListener('mousedown', (e) => {
            this.#isDragging = true;
            this.#lastMouseY = e.clientY;
            document.addEventListener('mousemove', (e) => this.#onMouseMove(e));
            document.addEventListener('mouseup', (e) => this.#onMouseUp(e));
        });

        this.value = startValue
    }

    get value() {
        return this.#value
    }

    set value(x) {
        this.#value = clamp(x, this.#minValue, this.#maxValue)
        this.#rotateObj()
    }

    get degree() {
        return remap(this.#value, this.#minValue, this.#maxValue, this.#minDegree, this.#maxDegree)
    }

    set degree(x) {
        this.value = remap(x, this.#minDegree, this.#maxDegree, this.#minValue, this.#maxValue)
    }

    #getImage() {
        return this.#obj.getElementsByTagName('img')[0]
    }

    #rotateObj() {
        this.#getImage().style.transform = 'rotate(' + this.degree + 'deg)'
    }

    #onMouseMove(e) {
        if (this.#isDragging) {
            const deltaY = this.#lastMouseY - e.clientY
            this.degree += deltaY
            this.#lastMouseY = e.clientY
        }
    }
      
    #onMouseUp() {
        this.#isDragging = false
        document.removeEventListener('mousemove', (e) => this.#onMouseMove(e))
        document.removeEventListener('mouseup', (e) => this.#onMouseUp(e))
    }

    #obj = null

    #minDegree = -179
    #maxDegree = 179

    #minValue = 0
    #maxValue = 100

    #value = 0

    #isDragging = false
    #lastMouseY = 0
}

class FixedDial {
    constructor(obj, modeDegrees, startMode) {
        this.#obj = obj
        this.#degrees = modeDegrees;
        this.mode = startMode;

        this.#getImage().ondragstart = function() { return false; };

        this.#obj.addEventListener('mousedown', (e) => {
            this.#isDragging = true;
            this.#lastMouseY = e.clientY;
            document.addEventListener('mousemove', (e) => this.#onMouseMove(e));
            document.addEventListener('mouseup', (e) => this.#onMouseUp(e));
        });

        this.mode = startMode
    }

    get mode() {
        return this.#mode
    }

    set mode(x) {
        this.#mode = clamp(x, 0, this.#degrees.length)
        this.#rotateObj()
    }

    switchToNextMode() {
        this.mode += 1
    }

    switchToPrevMode() {
        this.mode -= 1
    }

    get degree() {
        return this.#degrees[this.#mode]
    }

    #getImage() {
        return this.#obj.getElementsByTagName('img')[0]
    }

    #rotateObj() {
        this.#getImage().style.transform = 'rotate(' + this.degree + 'deg)'
    }

    #onMouseMove(e) {
        if (this.#isDragging) {
            const deltaY = this.#lastMouseY - e.clientY
            this.#yAccum += deltaY
            if (Math.abs(this.#yAccum) > this.#sensitivity) {
                if (this.#yAccum < 0) {
                    this.switchToNextMode()
                } else {
                    this.switchToPrevMode()
                }
                this.#yAccum = 0
            }

            this.#lastMouseY = e.clientY
        }
    }
      
    #onMouseUp() {
        this.#isDragging = false
        this.#yAccum = 0
        document.removeEventListener('mousemove', (e) => this.#onMouseMove(e))
        document.removeEventListener('mouseup', (e) => this.#onMouseUp(e))
    }

    #obj = null

    #degrees = []

    #mode = 0
    #sensitivity = 20 // px

    #isDragging = false
    #lastMouseY = 0
    #yAccum = 0
}