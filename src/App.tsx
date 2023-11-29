import {
  AbstractMesh,
  ArcRotateCamera,
  BabylonFileLoaderConfiguration,
  Color3,
  DirectionalLight,
  EventState,
  FreeCamera,
  GizmoManager,
  GlowLayer,
  GroundMesh,
  HemisphericLight,
  HighlightLayer,
  KeyboardEventTypes,
  LightGizmo,
  Mesh,
  MeshBuilder,
  MirrorTexture,
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
import { Slider, StackPanel, TextBlock } from '@babylonjs/gui'
import '@babylonjs/loaders/glTF'
// import '@babylonjs/loaders/OBJ'
import { CameraOutlined } from '@ant-design/icons'
import { PBRCustomMaterial } from '@babylonjs/materials'
import { Divider } from 'antd'
import SceneComponent from 'babylonjs-hook'
import * as CANNON from 'cannon'
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.less'
import { LightsSettingsComponent } from './components/lights'
import { getMeshTopParent, showNormals } from './uitls'

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

  const [cameraRotation, setCameraRotation] = useState<Vector3>(
    new Vector3(0, 1.22 * Math.PI, 0),
  )

  const [gizmoManager, setGizmoManager] = useState<GizmoManager>()
  const [positionGizmoEnabled, setPositionGizmoEnabled] =
    useState<boolean>(true)
  const [rotationGizmoEnabled, setRotationGizmoEnabled] =
    useState<boolean>(true)

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

    const godCamera = new FreeCamera(
      'camera-god',
      new Vector3(0, 200, 0),
      scene,
    )
    godCamera.setTarget(Vector3.Zero())
    godCamera.attachControl(canvas, false)
    godCamera.inputs.removeMouse()
    godCamera.inputs.addMouseWheel()

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

    scene.activeCamera = camera

    /** 半球光 */
    const envLight = new HemisphericLight(
      'envLight',
      new Vector3(0, 1, 0),
      scene,
    )
    envLight.intensity = 0.6

    /** 平行光/太阳光 */
    const sun = new DirectionalLight('sun', new Vector3(-10, -8, 0), scene)
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
    // 创建反射材质
    const refractionMaterial = new StandardMaterial('refractionMaterial', scene)
    ground.material = refractionMaterial

    // 设置反射的环境贴图
    refractionMaterial.refractionTexture = new MirrorTexture(
      'mirror',
      512,
      scene,
      true,
    )
    refractionMaterial.refractionTexture.level = 0.1 // 调整反射强度

    const gizmoManager = new GizmoManager(scene)
    gizmoManager.positionGizmoEnabled = true
    gizmoManager.rotationGizmoEnabled = true
    gizmoManager.attachableMeshes = []
    setGizmoManager(gizmoManager)

    const promises: Promise<any>[] = []

    const stagePromise = SceneLoader.LoadAssetContainerAsync(
      './assets/scenes/greenScreenStudio/',
      'scene.gltf',
      scene,
    ).then((container) => {
      const rootMesh = container.rootNodes[0] as Mesh
      rootMesh.id = '__greenScreenStudio-root__'
      rootMesh.scaling = new Vector3(0.2, 0.2, 0.2)
      rootMesh.position = new Vector3(0, -0.55, 0)
      shadowGenerator.addShadowCaster(rootMesh)
      container.addAllToScene()
      showNormals(rootMesh, scene)
      gizmoManager.attachableMeshes?.push(rootMesh)

      container.meshes.forEach((mesh) => {
        mesh.isPickable = false
        mesh.receiveShadows = true
        if (mesh.name === 'floor.001__0') {
          mesh.dispose()
        }
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
        const pointLight = new PointLight(
          'pointLight',
          new Vector3(
            position.x * rootMesh.scaling.x - 1,
            position.y * rootMesh.scaling.y,
            position.z * rootMesh.scaling.z,
          ),
          scene,
        )
        pointLight.shadowEnabled = true
        pointLight.diffuse = emissiveColor
        pointLight.specular = new Color3(0, 0, 0)
        pointLight.intensity = 0.1
        const pointGizmo = new LightGizmo()
        pointGizmo.light = pointLight

        pointLight.metadata = pointLight.metadata || {}
        pointLight.metadata.linkMesh = softMesh

        const sg = new ShadowGenerator(1024, pointLight)
        // spotLight.lightmapMode = Light.LIGHTMAP_SPECULAR
        // 抗锯齿
        sg.useBlurExponentialShadowMap = true
        sg.blurKernel = 0
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

    const studioLightPromise = SceneLoader.ImportMeshAsync(
      '',
      './assets/scenes/studioLights/simple/',
      'scene.gltf',
      scene,
    )
      .then((assets) => {
        const rootMesh = assets.meshes[0] as Mesh
        rootMesh.id = '__simple_studio_light-root__'
        rootMesh.scaling = new Vector3(10, 10, 10)
        rootMesh.position.x = -10
        rootMesh.position.y = 2
        rootMesh.position.z = 40
        rootMesh.rotation = new Vector3(0, Math.PI, 0)
        shadowGenerator.addShadowCaster(rootMesh)
        gizmoManager.attachableMeshes?.push(rootMesh)

        const emissiveColor = new Color3(1, 0, 0)
        const spotLightNode = rootMesh.getChildTransformNodes(false, (node) => {
          return node.name === '#LMP0001_Spotlight'
        })[0]
        if (spotLightNode) {
          const spotLight = new SpotLight(
            'spotLight',
            new Vector3(0, 0.3, 0),
            new Vector3(0, -2, 0),
            0.5 * Math.PI,
            10,
            scene,
          )

          spotLight.diffuse = emissiveColor
          spotLight.intensity = 2.4
          spotLight.parent = spotLightNode

          spotLight.metadata = spotLight.metadata || {}
          spotLight.metadata.linkMesh = assets.meshes[5]

          const pointGizmo = new LightGizmo()
          pointGizmo.light = spotLight

          const sg = new ShadowGenerator(1024, spotLight)
          // 抗锯齿
          sg.useBlurExponentialShadowMap = true
          sg.blurKernel = 32
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

        const lampMesh = assets.meshes[5] as Mesh
        ;(lampMesh.material as PBRCustomMaterial).emissiveColor = emissiveColor

        const gl = new GlowLayer('glow', scene, {
          mainTextureFixedSize: 1024,
          blurKernelSize: 64,
        })
        gl.intensity = 0.3
        gl.addIncludedOnlyMesh(lampMesh)
        gl.referenceMeshToUseItsOwnMaterial(lampMesh)
      })
      .catch((reason) => {
        console.error(`导入失败 ${reason}`)
      })
    promises.push(studioLightPromise)

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
        rootMesh.position = new Vector3(-14, 8.4, -10)

        rootMesh.rotation = new Vector3(0, 0.27 * Math.PI, 0)
        shadowGenerator.addShadowCaster(rootMesh)
        gizmoManager.attachableMeshes?.push(rootMesh)
      })
      .catch((reason) => {
        console.error(`导入失败 ${reason}`)
      })
    promises.push(womanPromise)

    SceneLoader.ImportMeshAsync('', './assets/camera/', 'scene.gltf', scene)
      .then((assets) => {
        const rootMesh = assets.meshes[0]
        rootMesh.id = '__camera-root__'
        rootMesh.scaling = new Vector3(10, 10, 10)
        rootMesh.position.x = 14
        rootMesh.position.y = 9
        rootMesh.position.z = 20
        rootMesh.rotation = new Vector3(0, 1.22 * Math.PI, 0)
        gizmoManager.attachableMeshes?.push(rootMesh)

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
      const womanMesh = scene.getMeshById('__woman-root__') as Nullable<Mesh>
      const greenMesh = scene.getMeshById(
        '__greenScreenStudio-root__',
      ) as Nullable<Mesh>

      const pointLight = scene.getLightByName('pointLight')
      const pointSg =
        pointLight?.getShadowGenerator() as Nullable<ShadowGenerator>
      if (pointSg) {
        womanMesh && pointSg.addShadowCaster(womanMesh)
        greenMesh && pointSg.addShadowCaster(greenMesh)
      }

      const spotLight = scene.getLightByName('spotLight')
      const spotSg =
        spotLight?.getShadowGenerator() as Nullable<ShadowGenerator>
      if (spotSg) {
        womanMesh && spotSg.addShadowCaster(womanMesh)
        greenMesh && spotSg.addShadowCaster(greenMesh)
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
    const isTouchGround = pointerInfo.pickInfo?.pickedMesh instanceof GroundMesh
    if (isTouchGround) {
      gizmoManager?.attachToMesh(null)
    }
    if (pointerInfo.event.button !== 0 || isTouchGround) {
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
    }

    const pointerObserver = currentScene?.onPointerObservable.add(
      (pointerInfo) => {
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
      },
    )

    const keyboardObserver = currentScene?.onKeyboardObservable.add(
      (keyboardInfo) => {
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

            if (currentScene.activeCamera.name === 'camera-god') {
              currentScene.getLightByName('envLight')!.intensity = 0.4
            } else {
              currentScene.getLightByName('envLight')!.intensity = 0.6
            }
          }
        }
      },
    )

    return () => {
      pointerObserver?.remove()
      keyboardObserver?.remove()
    }
  }, [currentScene])

  useEffect(() => {
    if (!currentScene) return
    const cameraMesh = currentScene.getMeshById('__camera-root__')
    if (!cameraMesh) return
    cameraMesh.rotation = cameraRotation
  }, [currentScene, cameraRotation])

  // 管理Gizmo
  useEffect(() => {
    if (gizmoManager) {
      gizmoManager.positionGizmoEnabled = positionGizmoEnabled
      gizmoManager.rotationGizmoEnabled = rotationGizmoEnabled
      let direction = new Vector3(0, -2, 0)
      gizmoManager.gizmos.rotationGizmo?.onDragStartObservable.add(() => {
        const spotLight = currentScene?.getLightByName(
          'spotLight',
        ) as Nullable<SpotLight>
        if (spotLight) {
          direction = spotLight.direction
        }
      })
      gizmoManager.gizmos.rotationGizmo?.onDragEndObservable.add(() => {
        const spotLight = currentScene?.getLightByName(
          'spotLight',
        ) as Nullable<SpotLight>
        if (spotLight) {
          spotLight.direction = direction
        }
      })
    }
  }, [currentScene, gizmoManager, positionGizmoEnabled, rotationGizmoEnabled])

  const takePhoto = () => {
    const engine = currentScene?.getEngine()
    const camera = currentScene?.activeCamera

    if (!engine || !camera) {
      return
    }
    Tools.CreateScreenshot(
      engine,
      camera,
      { precision: 2 },
      undefined,
      undefined,
      true,
    )
  }

  return (
    <div className='App'>
      <div className='operation-panel'>
        <label>
          截图：
          <CameraOutlined onClick={takePhoto} />
        </label>
        <Divider className='panel-divider' />
        <LightsSettingsComponent scene={currentScene} />
      </div>
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
