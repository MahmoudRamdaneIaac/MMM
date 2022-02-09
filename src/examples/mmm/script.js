// Import libraries
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
import { RhinoCompute } from 'https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js'

const definitionName = 'mmm.gh'

// Set up sliders
const length_slider = document.getElementById('Length')
length_slider.addEventListener('mouseup', onSliderChange, false)
length_slider.addEventListener('touchend', onSliderChange, false)

const depth_slider = document.getElementById('Depth')
depth_slider.addEventListener('mouseup', onSliderChange, false)
depth_slider.addEventListener('touchend', onSliderChange, false)

const numberoffaçades_slider = document.getElementById('Number of Façades')
numberoffaçades_slider.addEventListener('mouseup', onSliderChange, false)
numberoffaçades_slider.addEventListener('touchend', onSliderChange, false)

const tramedestructure_slider = document.getElementById('Trame de sructure')
tramedestructure_slider.addEventListener('mouseup', onSliderChange, false)
tramedestructure_slider.addEventListener('touchend', onSliderChange, false)

const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/')

let rhino, definition, doc
rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.')
    rhino = m // global

    //RhinoCompute.url = getAuth( 'http://localhost:8081/' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
    //RhinoCompute.apiKey = getAuth( '123456789' )  // RhinoCompute server api key. Leave blank if debugging locally.
    RhinoCompute.url = 'http://localhost:8081/' //if debugging locally.
    // load a grasshopper file!
    const url = definitionName
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const arr = new Uint8Array(buffer)
    definition = arr

    init()
    compute()
})

async function compute() {


    const param1 = new RhinoCompute.Grasshopper.DataTree('Depth')
    param1.append([0], [depth_slider.valueAsNumber])

    const param2 = new RhinoCompute.Grasshopper.DataTree('Length')
    param2.append([0], [length_slider.valueAsNumber])

    const param3 = new RhinoCompute.Grasshopper.DataTree('Number of Façades')
    param3.append([0], [numberoffaçades_slider.valueAsNumber])

    const param4 = new RhinoCompute.Grasshopper.DataTree('Trame de sructure')
    param4.append([0], [tramedestructure_slider.valueAsNumber])

    // clear values
    const trees = []
    trees.push(param1)
    trees.push(param2)
    trees.push(param3)
    trees.push(param4)

    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)

    doc = new rhino.File3dm()

    // hide spinner
    document.getElementById('loader').style.display = 'none'

    for (let i = 0; i < res.values.length; i++) {

        for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
            for (const d of value) {

                const data = JSON.parse(d.data)
                const rhinoObject = rhino.CommonObject.decode(data)
                doc.objects().add(rhinoObject, null)

            }
        }
    }


    // clear objects from scene
    scene.traverse(child => {
        if (!child.isLight) {
            scene.remove(child)
        }
    })


    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse(buffer, function (object) {

        scene.add(object)
        // hide spinner
        document.getElementById('loader').style.display = 'none'

    })
}


function onSliderChange() {
    // show spinner
    document.getElementById('loader').style.display = 'block'
    compute()
}




// BOILERPLATE //

let scene, camera, renderer, controls

function init() {


    //Change up to z-axis
THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 )
    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe7d7d1);
let ScreenW = window.innerWidth;
let ScreenH = window.innerHeight;
let ARatio = ScreenW/ScreenH;
camera = new THREE.PerspectiveCamera(20, ARatio,0.1, 1000 );
camera.position.set(30, -100, 45); 


    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)

    // add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.intensity = 2
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight()
    scene.add(ambientLight)

    animate()
}

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    animate()
}

function meshToThreejs(mesh, material) {
    const loader = new THREE.BufferGeometryLoader()
    const geometry = loader.parse(mesh.toThreejsJSON())
    return new THREE.Mesh(geometry, material)
}