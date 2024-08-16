const button = document.querySelector("button");

const C2   = 0
const Csh2 = 1
const D2   = 2
const Dsh2 = 3
const E2   = 4 // E string
const F2   = 5
const Fsh2 = 6
const G2   = 7
const Gsh2 = 8
const A2   = 9 // A string
const Ash2 = 10
const B2   = 11

const C3   = 12
const Csh3 = 13
const D3   = 14 // D string
const Dsh3 = 15
const E3   = 16
const F3   = 17
const Fsh3 = 18
const G3   = 19 // G string
const Gsh3 = 20
const A3   = 21
const Ash3 = 22
const B3   = 23 // B string

const C4   = 24
const Csh4 = 25
const D4   = 26
const Dsh4 = 27
const E4   = 28 // e string
const F4   = 29
const Fsh4 = 30
const G4   = 31
const Gsh4 = 32
const A4   = 33
const Ash4 = 34
const B4   = 35

const C5   = 36
const Csh5 = 37
const D5   = 38
const Dsh5 = 39
const E5   = 40
const F5   = 41
const Fsh5 = 42
const G5   = 43
const Gsh5 = 44
const A5   = 45
const Ash5 = 46
const B5   = 47

const C6   = 48
const Csh6 = 49
const D6   = 50
const Dsh6 = 51
const E6   = 52
const F6   = 53
const Fsh6 = 54
const G6   = 55
const Gsh6 = 56
const A6   = 57
const Ash6 = 58
const B6   = 59

// Notes duration in terms of beats per second for 4/4
const FOURTH = 1
const EIGHTH = FOURTH / 2
const SIXTEENTH = EIGHTH / 2
const HALF = FOURTH * 2
const WHOLE = HALF * 2

const FOURTH_DOT = FOURTH * 1.5
const EIGHTH_DOT = EIGHTH * 1.5
const SIXTEENTH_DOT = SIXTEENTH * 1.5
const HALF_DOT = HALF * 1.5

const FOURTH_PAUSE = -FOURTH
const EIGHTH_PAUSE = -EIGHTH
const SIXTEENTH_PAUSE = -SIXTEENTH
const HALF_PAUSE = -HALF
const WHOLE_PAUSE = -WHOLE

const FOURTH_DOT_PAUSE = -FOURTH_DOT
const EIGHTH_DOT_PAUSE = -EIGHTH_DOT
const SIXTEENTH_DOT_PAUSE = -SIXTEENTH_DOT
const HALF_DOT_PAUSE = -HALF_DOT

// Settings
const BPM = 120
const GUITAR_VOLUME = 0.5
const GUITAR_GAIN = 400
const DAMPING_START = 0
const DAMPING_DURATION = 0.03
const GUITAR_PLAYING_ERRORS = 0.07
const DEBUG_MODE = false

let guitarEffectsChain = []

let context

let guitarSample
let SAMPLE_NOTE

let soundNodes = []

let guitarTimeline = 0.0

async function init() {
    context = new AudioContext()

    guitarSample = await loadGuitarSample()

    let guitarGain = context.createGain()
    guitarGain.gain.value = GUITAR_VOLUME

    guitarEffectsChain = [guitarGain, context.destination]

    guitarGain.connect(context.destination)
}

async function loadSample(path) {
    return fetch(path)
        .then(response => response.arrayBuffer())
        .then(buffer => context.decodeAudioData(buffer))
}

async function loadGuitarSample() {
    SAMPLE_NOTE = D3;
    return await loadSample("./sound/guitar_d_string.wav")
}

function createGuitarSource(noteToPlay) {
    const source = context.createBufferSource()
    source.buffer = guitarSample
    source.playbackRate.value = 2 ** ((noteToPlay - SAMPLE_NOTE) / 12)
    return source
}

const randomFloat = (min, max) => Math.random() * (max - min) + min;

const LFO_SINE = 0
const LFO_TRIANGLE = 1
const LFO_SQUARE = 2
const LFO_RAMP = 3

function lfo(sampleNumber, sampleRate, lfoType, frequency, depth) {
    const time = sampleNumber / sampleRate

    const x = 2 * Math.PI * frequency * time

    if (lfoType == LFO_SINE) {
	    return depth * Math.sin(x)

    } else if (lfoType == LFO_TRIANGLE) {
        const magic = x/(2*Math.PI)
        const triangle = 2 * Math.abs( 2*(magic - Math.floor(0.5 + magic)) ) - 1
        return depth * triangle

    } else if (lfoType == LFO_SQUARE) {
        return depth * Math.sign( depth * Math.sin(x) )

    } else if (lfoType == LFO_RAMP) {
        const magic = x/(2*Math.PI)
        const ramp = 2*(magic - Math.floor(0.5 + magic))
        return depth * ramp
    }
}

/**
 * Create a function that maps a value to a range
 * @param  {Number}   inMin    Input range minimun value
 * @param  {Number}   inMax    Input range maximun value
 * @param  {Number}   outMin   Output range minimun value
 * @param  {Number}   outMax   Output range maximun value
 * @return {function}          A function that converts a value
 * 
 * @author github.com/victornpb
 * @see https://stackoverflow.com/a/41350248/938822
 */
function remap(x, inMin, inMax, outMin, outMax) {
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
};

function playGuitarSound(notes, duration) {
    const seconds = duration / (BPM / 60)
    const startTime = context.currentTime + guitarTimeline
    const endTime = startTime + seconds

    const lfoSampleRate = 256
    const lfoTime = lfoSampleRate * seconds

    const lfoType = LFO_TRIANGLE
    const lfoRate = 2
    const lfoDepth = 20
    //const lfoDepth = 0.25

    for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
        const sample = createGuitarSource(notes[noteIndex])

        sample.connect(guitarEffectsChain[0])

        for (var sampleNumber = 0; sampleNumber < lfoTime; sampleNumber++) {
            const value = lfo(sampleNumber, lfoSampleRate, lfoType, lfoRate, lfoDepth)
            const time = startTime + sampleNumber/lfoSampleRate

            //console.log(value, time)

            // Vibrato
            sample.detune.setValueAtTime(value, time)
            
            // Tremolo
            //guitarEffectsChain[0].gain.setValueAtTime(value, time)
        }
        
        sample.start(startTime + randomFloat(0, GUITAR_PLAYING_ERRORS))
        sample.stop(endTime + DAMPING_DURATION + randomFloat(0, GUITAR_PLAYING_ERRORS))

        soundNodes.push(sample)
    }

    // Chorus
    // for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
    //     const sample = createGuitarSource(notes[noteIndex])

    //     sample.connect(guitarEffectsChain[0])

    //     sample.start(startTime + randomFloat(0, GUITAR_PLAYING_ERRORS))
    //     sample.stop(endTime + DAMPING_DURATION + randomFloat(0, GUITAR_PLAYING_ERRORS))

    //     soundNodes.push(sample)
    // }

    guitarTimeline += seconds
}

function playGuitarPause(duration) {
    const seconds = Math.abs(duration) / (BPM / 60)
    guitarTimeline += seconds
}

SHORT = 0
FULL = 1

function createPowerChord(tonica, type = FULL) {
    return type == SHORT
        ? [tonica, tonica + 7]
        : [tonica, tonica + 7, tonica + 12]
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function generateNote() {
    return getRandomInt(E2, E3)
}

button.onclick = async () => {
    if (!context) {
        await init();
    }

    for (let i = 0; i < soundNodes.length; ++i) {
        soundNodes[i].stop(0)
    }
    soundNodes = []

    playGuitarSound([D3], WHOLE*10)

    guitarTimeline = 0
};
