import {
  AbstractMesh,
  Color3,
  DynamicTexture,
  LinesMesh,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexBuffer,
} from '@babylonjs/core'

/**
 * 显示scene坐标系
 * @param scene
 * @param size
 */
const showWorldAxis = function (scene: Scene, size: number) {
  const makeTextPlane = function (text: string, color: string, size: number) {
    var dynamicTexture = new DynamicTexture('DynamicTexture', 50, scene, true)
    dynamicTexture.hasAlpha = true
    dynamicTexture.drawText(
      text,
      5,
      40,
      'bold 36px Arial',
      color,
      'transparent',
      true,
    )
    var plane = MeshBuilder.CreatePlane(`TextPlane-${text}`, { size }, scene)
    plane.material = new StandardMaterial('TextPlaneMaterial', scene)
    plane.material.backFaceCulling = false
    ;(plane.material as StandardMaterial).specularColor = new Color3(0, 0, 0)
    ;(plane.material as StandardMaterial).diffuseTexture = dynamicTexture
    return plane
  }

  const axisX =
    (scene.getMeshByName('axisX') as LinesMesh) ||
    MeshBuilder.CreateLines(
      'axisX',
      {
        points: [
          Vector3.Zero(),
          new Vector3(size, 0, 0),
          new Vector3(size * 0.95, 0.05 * size, 0),
          new Vector3(size, 0, 0),
          new Vector3(size * 0.95, -0.05 * size, 0),
        ],
      },
      scene,
    )
  axisX.color = new Color3(1, 0, 0)
  const xChar =
    (scene.getMeshByName('TextPlane-X') as Mesh) ||
    makeTextPlane('X', 'red', size / 10)
  xChar.position = new Vector3(0.9 * size, 0.05 * size, 0)

  const axisY =
    (scene.getMeshByName('axisY') as LinesMesh) ||
    MeshBuilder.CreateLines(
      'axisY',
      {
        points: [
          Vector3.Zero(),
          new Vector3(0, size, 0),
          new Vector3(-0.05 * size, size * 0.95, 0),
          new Vector3(0, size, 0),
          new Vector3(0.05 * size, size * 0.95, 0),
        ],
      },
      scene,
    )
  axisY.color = new Color3(0, 1, 0)
  const yChar =
    (scene.getMeshByName('TextPlane-Y') as Mesh) ||
    makeTextPlane('Y', 'green', size / 10)
  yChar.position = new Vector3(0, 0.9 * size, -0.05 * size)

  const axisZ =
    (scene.getMeshByName('axisZ') as LinesMesh) ||
    MeshBuilder.CreateLines(
      'axisZ',
      {
        points: [
          Vector3.Zero(),
          new Vector3(0, 0, size),
          new Vector3(0, -0.05 * size, size * 0.95),
          new Vector3(0, 0, size),
          new Vector3(0, 0.05 * size, size * 0.95),
        ],
      },
      scene,
    )
  axisZ.color = new Color3(0, 0, 1)
  const zChar =
    (scene.getMeshByName('TextPlane-Z') as Mesh) ||
    makeTextPlane('Z', 'blue', size / 10)
  zChar.position = new Vector3(0, 0.05 * size, 0.9 * size)
}

/** 显示Mesh坐标系 */
function localAxes(scene: Scene, originMesh: Mesh, size: number) {
  const [axisX, axisY, axisZ] = [
    'pilot_local_axisX',
    'pilot_local_axisY',
    'pilot_local_axisZ',
  ]
  const childMeshes = originMesh.getChildMeshes()

  const pilot_local_axisX =
    (childMeshes.find((mesh) => mesh.name === axisX) as LinesMesh) ||
    MeshBuilder.CreateLines(
      axisX,
      {
        points: [
          Vector3.Zero(),
          new Vector3(size, 0, 0),
          new Vector3(size * 0.95, 0.05 * size, 0),
          new Vector3(size, 0, 0),
          new Vector3(size * 0.95, -0.05 * size, 0),
        ],
      },
      scene,
    )
  pilot_local_axisX.color = new Color3(1, 0, 0)

  const pilot_local_axisY =
    (childMeshes.find((mesh) => mesh.name === axisY) as LinesMesh) ||
    MeshBuilder.CreateLines(
      axisY,
      {
        points: [
          Vector3.Zero(),
          new Vector3(0, size, 0),
          new Vector3(-0.05 * size, size * 0.95, 0),
          new Vector3(0, size, 0),
          new Vector3(0.05 * size, size * 0.95, 0),
        ],
      },
      scene,
    )
  pilot_local_axisY.color = new Color3(0, 1, 0)

  const pilot_local_axisZ =
    (childMeshes.find((mesh) => mesh.name === axisZ) as LinesMesh) ||
    MeshBuilder.CreateLines(
      axisZ,
      {
        points: [
          Vector3.Zero(),
          new Vector3(0, 0, size),
          new Vector3(0, -0.05 * size, size * 0.95),
          new Vector3(0, 0, size),
          new Vector3(0, 0.05 * size, size * 0.95),
        ],
      },
      scene,
    )
  pilot_local_axisZ.color = new Color3(0, 0, 1)

  pilot_local_axisX.parent = originMesh
  pilot_local_axisY.parent = originMesh
  pilot_local_axisZ.parent = originMesh
}

/** 获取顶级Mesh */
function getMeshTopParent(mesh: TransformNode): AbstractMesh {
  const parent = mesh.parent as TransformNode
  if (parent === null) {
    return mesh as AbstractMesh
  }
  return getMeshTopParent(parent)
}

/** 获取Pickable父Mesh */
function getMeshPickableParent(mesh: AbstractMesh): AbstractMesh {
  if (mesh.isPickable) {
    return mesh
  }
  const parent = mesh.parent
  if (parent === null) {
    return mesh as AbstractMesh
  }
  if (parent instanceof AbstractMesh && parent.isPickable) {
    return parent
  }
  return getMeshPickableParent(parent as AbstractMesh)
}

/**
 * 显示Mesh的法线
 * @param mesh 
 * @param scene 
 * @param size 
 * @param color 
 * @returns 
 */
function showNormals(mesh: AbstractMesh, scene: Scene, size?: number, color?: Color3) {
  const normals = mesh.getVerticesData(VertexBuffer.NormalKind)
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind)
  color = color || Color3.White()
  size = size || 1
  const lines = []
  if (normals && positions) {
    for (var i = 0; i < normals.length; i += 3) {
      const v1 = Vector3.FromArray(positions, i)
      const v2 = v1.add(Vector3.FromArray(normals, i).scaleInPlace(size))
      lines.push([v1.add(mesh.position), v2.add(mesh.position)])
    }
  }

  const normalLines = MeshBuilder.CreateLineSystem(
    'normalLines',
    { lines: lines },
    scene,
  )
  normalLines.color = color
  return normalLines
}

export { getMeshPickableParent, getMeshTopParent, localAxes, showWorldAxis, showNormals }

