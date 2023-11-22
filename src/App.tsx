import {
  AbstractMesh,
  ArcRotateCamera,
  BabylonFileLoaderConfiguration,
  Color3,
  DirectionalLight,
  EventState,
  FreeCamera,
  GroundMesh,
  HemisphericLight,
  HighlightLayer,
  KeyboardEventTypes,
  Light,
  LightGizmo,
  Mesh,
  MeshBuilder,
  Nullable,
  PointLight,
  PointerEventTypes,
  PointerInfo,
  Scene,
  SceneLoader,
  ShadowGenerator,
  SpotLight,
  StandardMaterial,
  Tools,
  Vector3,
} from '@babylonjs/core'
// loader 必须添加
import {
  AdvancedDynamicTexture,
  Control,
  Slider,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui'
import '@babylonjs/loaders/glTF'
// import '@babylonjs/loaders/OBJ'
import { PBRCustomMaterial } from '@babylonjs/materials'
import SceneComponent from 'babylonjs-hook'
import * as CANNON from 'cannon'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { getMeshTopParent, showNormals, showWorldAxis } from './uitls'

BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine = CANNON

// https://juejin.cn/post/7057064088446173220

const addSlider = (
  name: string | undefined,
  panel: StackPanel,
  text: string,
  value: number = 0,
  callback?: (eventData: number, eventState: EventState) => void,
  foreground: string = 'gray',
) => {
  const header = new TextBlock()
  header.text = `${text}: ${Tools.ToDegrees(value) | 0} deg`
  header.height = '30px'
  header.color = 'white'
  panel.addControl(header)

  const slider = new Slider(name)
  slider.minimum = 0
  slider.maximum = 2 * Math.PI
  slider.borderColor = 'black'
  slider.color = foreground
  slider.background = 'white'
  slider.height = '20px'
  slider.width = '200px'
  slider.value = value
  slider.onValueChangedObservable.add((eventData, eventSate) => {
    header.text = `${text}: ${Tools.ToDegrees(eventData) | 0} deg`
    callback && callback(eventData, eventSate)
  })

  panel.addControl(slider)
}

function App() {
  const [currentScene, setCurrentScene] = useState<Scene>()
  const [ground, setGround] = useState<GroundMesh>()
  const record = useRef<{
    startingPoint: Nullable<Vector3>
    currentMesh: AbstractMesh
  }>()

  const [cameraRotation, setCameraRotation] = useState<Vector3>(new Vector3(0, 1.22 * Math.PI, 0))

  const onResize = useCallback(() => {
    currentScene?.getEngine()?.resize()
  }, [currentScene])

  const onSceneReady = useCallback((scene: Scene) => {
    setCurrentScene(scene)
    const canvas = scene.getEngine().getRenderingCanvas()
    // 启用阴影生成
    scene.shadowsEnabled = true
    scene.useRightHandedSystem = true
    // scene.createDefaultEnvironment({ createGround: false, sizeAuto: true })

    const camera = new ArcRotateCamera(
      'Camera',
      0,
      0.8,
      180,
      Vector3.Zero(),
      scene,
    )
    camera.lowerBetaLimit = 0.1
    // 横轴上允许的最大角度 Y轴上下
    camera.upperBetaLimit = (Math.PI / 2) * 0.9
    // 摄像机到目标的最小允许距离
    camera.lowerRadiusLimit = 10
    // 摄像机到目标的最大允许距离
    camera.upperRadiusLimit = 720
    camera.attachControl(canvas, true)
    // 相机最远距离
    camera.maxZ = 1000

    /** 半球光 */
    const envLight = new HemisphericLight(
      'envLight',
      new Vector3(0, 1, 0),
      scene,
    )
    envLight.intensity = 0.6

    /** 平行光/太阳光 */
    const sun = new DirectionalLight('sun', new Vector3(-10, -1, 0), scene)
    sun.position = new Vector3(100, 1000, 0)
    // sun.lightmapMode = Light.LIGHTMAP_SPECULAR
    sun.diffuse = new Color3(0.94, 0.73, 0.51)
    sun.specular = new Color3(0.2, 0.2, 0.2) // 控制高光颜色
    // sun.groundColor = new Color3(0.5, 0.5, 0.5); // 控制地面颜色
    const lightPointGizmo = new LightGizmo()
    lightPointGizmo.light = sun
    sun.setEnabled(false)

    const shadowGenerator = new ShadowGenerator(1024, sun)
    // 抗锯齿
    shadowGenerator.useBlurExponentialShadowMap = true
    shadowGenerator.blurKernel = 32
    // 阴影暗度
    shadowGenerator.setDarkness(0)
    shadowGenerator.filter = ShadowGenerator.FILTER_PCF
    // // PCF,webgl2可用，在加载性能上有很大提升
    shadowGenerator.usePercentageCloserFiltering = true
    // // 透明阴影
    shadowGenerator.enableSoftTransparentShadow = true
    shadowGenerator.transparencyShadow = true
    // // 偏移量
    shadowGenerator.bias = 0.001
    // // 应用于深度防止acnea的偏移量
    shadowGenerator.normalBias = 0.002

    /** 地面 */
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 100, height: 100 },
      scene,
    )
    setGround(ground)
    ground.receiveShadows = true

    const promises: Promise<any>[] = []

    const stagePromise = SceneLoader.LoadAssetContainerAsync(
      './assets/scenes/greenScreenStudio/',
      'scene.gltf',
      scene,
    ).then((container) => {
      const rootMesh = container.rootNodes[0] as Mesh
      rootMesh.id = '__greenScreenStudio-root__'
      rootMesh.scaling = new Vector3(0.2, 0.2, 0.2)
      rootMesh.position = new Vector3(0, 0, 0)
      shadowGenerator.addShadowCaster(rootMesh)
      container.addAllToScene()
      showNormals(rootMesh, scene)

      container.meshes.forEach((mesh) => {
        mesh.isPickable = false
        mesh.receiveShadows = true
      })
      const emissiveColor = new Color3(0.94, 0.73, 0.51)
      const softMesh = container.meshes.find(
        (mesh) => mesh.name === 'box shader_emision_0',
      ) as Nullable<Mesh>
      if (softMesh) {
        ;(softMesh.material as Nullable<PBRCustomMaterial>)!.emissiveColor =
          emissiveColor
        const hl = new HighlightLayer('hl1', scene)
        hl.addMesh(softMesh, emissiveColor, false)
        const position = softMesh.absolutePosition.clone()
        const spotLight = new PointLight(
          'spotLight',
          new Vector3(
            position.x * rootMesh.scaling.x - 1,
            position.y * rootMesh.scaling.y,
            position.z * rootMesh.scaling.z,
          ),
          scene,
        )
        spotLight.shadowEnabled = true
        spotLight.diffuse = emissiveColor
        spotLight.specular = new Color3(0.99, 0.96, 0.67)
        spotLight.intensity = 300
        // spotLight.parent = softMesh
        const pointGizmo = new LightGizmo()
        pointGizmo.light = spotLight

        const sg = new ShadowGenerator(1024, spotLight)
        // spotLight.lightmapMode = Light.LIGHTMAP_SPECULAR
        // 抗锯齿
        sg.useBlurExponentialShadowMap = true
        sg.blurKernel = 1
        // 阴影暗度
        sg.setDarkness(0)
        sg.filter = ShadowGenerator.FILTER_PCF
        // PCF,webgl2可用，在加载性能上有很大提升
        sg.usePercentageCloserFiltering = true
        // 透明阴影
        sg.enableSoftTransparentShadow = true
        sg.transparencyShadow = true
        // 偏移量
        sg.bias = 0.001
        // 应用于深度防止acnea的偏移量
        sg.normalBias = 0.002
      }

      // const lightbulbs = container.meshes.filter(mesh => mesh.name.startsWith('lightbulb') && mesh.name.endsWith('emision_0'))
    })
    promises.push(stagePromise)

    const womanPromise = SceneLoader.ImportMeshAsync(
      '',
      './assets/scenes/woman/',
      'scene.gltf',
      scene,
    )
      .then((assets) => {
        const rootMesh = assets.meshes[0]
        rootMesh.id = '__woman-root__'
        rootMesh.scaling = new Vector3(0.01, 0.01, 0.01)
        rootMesh.position = new Vector3(-14, 9, -10)

        rootMesh.rotation = new Vector3(0, 0.27 * Math.PI, 0)
        shadowGenerator.addShadowCaster(rootMesh)
      })
      .catch((reason) => {
        console.error(`导入失败 ${reason}`)
      })
    promises.push(womanPromise)

    SceneLoader.ImportMeshAsync(
      '',
      './assets/camera/',
      'scene.gltf',
      scene,
    )
      .then((assets) => {
        const rootMesh = assets.meshes[0]
        rootMesh.id = '__camera-root__'
        rootMesh.scaling = new Vector3(10, 10, 10)
        rootMesh.position.x = 14
        rootMesh.position.y = 9
        rootMesh.position.z = 20
        rootMesh.rotation = new Vector3(0, 1.22 * Math.PI, 0)

        const freeCamera = new FreeCamera('camera-1', Vector3.Zero(), scene)
        freeCamera.parent = rootMesh

        freeCamera.attachControl(canvas, false)
        // 禁用相机的鼠标和键盘控制
        freeCamera.inputs.clear()
      })
      .catch((reason) => {
        console.error(`导入失败 ${reason}`)
      })

    Promise.all(promises).then(() => {
      const spotLight = scene.getLightByName('spotLight')
      const sg = spotLight?.getShadowGenerator() as Nullable<ShadowGenerator>
      if (sg) {
        const womanMesh = scene.getMeshById('__woman-root__')
        womanMesh && sg.addShadowCaster(womanMesh)

        const houseMesh = scene.getMeshById(
          '__greenScreenStudio-root__',
        ) as Nullable<Mesh>
        houseMesh && sg.addShadowCaster(houseMesh)
      }
    })
  }, [])

  /** 获取鼠标地板位置 */
  const getGroundPosition = () => {
    const pickInfo = currentScene?.pick(
      currentScene.pointerX,
      currentScene.pointerY,
      function (mesh) {
        return mesh === ground
      },
    )
    if (pickInfo?.hit) {
      return pickInfo.pickedPoint
    }

    return null
  }

  const onPointerDown = (pointerInfo: PointerInfo) => {
    if (
      pointerInfo.event.button !== 0 ||
      pointerInfo.pickInfo?.pickedMesh instanceof GroundMesh
    ) {
      return
    }

    if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo?.pickedMesh) {
      record.current = {
        currentMesh: getMeshTopParent(pointerInfo.pickInfo.pickedMesh),
        startingPoint: getGroundPosition(),
      }
      if (record.current.startingPoint) {
        // we need to disconnect camera from canvas
        setTimeout(() => {
          currentScene?.activeCamera?.detachControl(
            currentScene.getEngine().getRenderingCanvas(),
          )
        }, 0)
      }
    }
  }

  const onPointerMove = (pointerInfo: PointerInfo) => {
    if (!record.current?.startingPoint) {
      return
    }
    const pickedPoint = getGroundPosition()

    if (!pickedPoint) {
      return
    }

    const diff = pickedPoint.subtract(record.current?.startingPoint)

    record.current.currentMesh.position.addInPlace(diff)

    record.current.startingPoint = pickedPoint
  }

  const onPointerUp = (pointerInfo: PointerInfo) => {
    if (record.current?.startingPoint) {
      currentScene?.activeCamera?.attachControl(
        currentScene.getEngine().getRenderingCanvas(),
        true,
      )
      record.current.startingPoint = null
      return
    }
  }

  useEffect(() => {
    if (currentScene) {
      // showWorldAxis(currentScene, 500)
      // currentScene.debugLayer.show()

      currentScene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
          case PointerEventTypes.POINTERDOWN:
            onPointerDown(pointerInfo)
            break
          case PointerEventTypes.POINTERUP:
            onPointerUp(pointerInfo)
            break
          case PointerEventTypes.POINTERMOVE:
            onPointerMove(pointerInfo)
            break
        }
      })

      currentScene.onKeyboardObservable.add((keyboardInfo) => {
        console.log(keyboardInfo)

        if (keyboardInfo.event.key.toLowerCase() === 'c') {
          if (keyboardInfo.type === KeyboardEventTypes.KEYDOWN) {
            const currentCamera = currentScene.activeCamera
            if (currentCamera) {
              const activeIndex = currentScene.cameras.indexOf(currentCamera)
              if (activeIndex == currentScene.cameras.length - 1) {
                currentScene.activeCamera = currentScene.cameras[0]
              } else {
                currentScene.activeCamera =
                  currentScene.cameras[activeIndex + 1]
              }
            } else {
              currentScene.activeCamera = currentScene.cameras[0]
            }
          }
        }
      })

      const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI')
      const panel = new StackPanel()
      panel.width = '260px'
      panel.top = '-25px'
      panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT
      panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
      advancedTexture.addControl(panel)

      addSlider(
        'camera-roate-x',
        panel,
        'camera-roate-x',
        cameraRotation.x,
        (value, eventState) => {
          setCameraRotation(
            new Vector3(value, cameraRotation.y, cameraRotation.z),
          )
        },
      )
      addSlider(
        'camera-roate-y',
        panel,
        'camera-roate-y',
        cameraRotation.y,
        (value, eventState) => {
          setCameraRotation(
            new Vector3(cameraRotation.x, value, cameraRotation.z),
          )
        },
      )
      addSlider(
        'camera-roate-z',
        panel,
        'camera-roate-z',
        cameraRotation.z,
        (value, eventState) => {
          setCameraRotation(
            new Vector3(cameraRotation.x, cameraRotation.y, value),
          )
        },
      )

      currentScene.onDispose = () => {
        advancedTexture.releaseInternalTexture()
      }
    }

    return () => {
      // advancedTexture.releaseInternalTexture()
    }
  }, [currentScene])

  useEffect(() => {
    if (!currentScene) return
    const cameraMesh = currentScene.getMeshById('__camera-root__')
    if (!cameraMesh) return
    cameraMesh.rotation = cameraRotation
  }, [currentScene, cameraRotation])

  return (
    <div className='App'>
      <SceneComponent
        id='renderCanvas'
        antialias
        engineOptions={{
          deterministicLockstep: false,
          lockstepMaxSteps: 4,
          adaptToDeviceRatio: true,
        }}
        adaptToDeviceRatio
        onSceneReady={onSceneReady}
        onResize={onResize}
      />
    </div>
  )
}
export default App
