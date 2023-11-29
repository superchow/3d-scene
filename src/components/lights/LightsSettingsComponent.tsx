import {
  DirectionalLight,
  HemisphericLight,
  Light,
  PointLight,
  Scene,
  SpotLight,
} from '@babylonjs/core'
import { Collapse, CollapseProps } from 'antd'
import cx from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import LightSettingsComponent from './LightSettingsComponent'
import './LightsSettingsComponent.less'

export type LightsSettingsComponentProps = {
  scene: Scene | undefined | null
} & CollapseProps

const HeaderLabel = (porps: { light: Light }) => {
  const { light } = porps
  const name = useMemo(() => {
    let str = ''
    if (light instanceof HemisphericLight) {
      str = `HemisphericLight`
    } else if (light instanceof DirectionalLight) {
      str = `DirectionalLight`
    } else if (light instanceof PointLight) {
      str = `PointLight`
    } else if (light instanceof SpotLight) {
      str = `SpotLight`
    } else {
      str = `Light`
    }
    return `${str}  ${light.id}`
  }, [light])
  return <span>{name}</span>
}
/**
 * 场景灯光配置列表
 * @param props
 * @returns
 */
const LightsSettingsComponent = (props: LightsSettingsComponentProps) => {
  const { scene, className, ...restProps } = props
  const [lights, setLights] = useState<Light[] | undefined>(scene?.lights)

  useEffect(() => {
    const removedObservable = scene?.onLightRemovedObservable.add(
      (light, state) => {
        setLights([...scene.lights])
      },
    )
    const addedObservable = scene?.onNewLightAddedObservable.add(
      (light, state) => {
        setLights([...scene.lights])
      },
    )

    return () => {
      removedObservable?.remove()
      addedObservable?.remove()
    }
  }, [scene])

  return (
    <Collapse
      className={cx('scene-lights lights-collapse', className)}
      {...restProps}>
      {lights?.map((light, idx) => (
        <Collapse.Panel
          key={`${idx}-${light.id}`}
          className='lights-collapse-panel'
          header={<HeaderLabel light={light} />}>
          <LightSettingsComponent
            className='scene-light-item'
            light={light}
            data-index={idx}
          />
        </Collapse.Panel>
      ))}
    </Collapse>
  )
}

export default LightsSettingsComponent
