import {
  DirectionalLight,
  HemisphericLight,
  Light,
  PointLight,
  SpotLight,
} from '@babylonjs/core'
import cx from 'classnames'
import { HTMLAttributes } from 'react'
import DirectionalLightSettings from './DirectionalLight'
import HemisphericLightSettings from './HemisphericLight'
import './LightSettingsComponent.less'
import PointLightSettings from './PointLight'
import SpotLightSettings from './SpotLight'

export type LightSettingsComponentProps = {
  light: Light
} & HTMLAttributes<HTMLDivElement>

const LightSettingsComponent = (props: LightSettingsComponentProps) => {
  const { light, className, ...restProps } = props

  let component: JSX.Element
  if (light instanceof HemisphericLight) {
    component = (
      <HemisphericLightSettings
        className={cx('light-settings', className)}
        light={light}
        {...restProps}
      />
    )
  } else if (light instanceof DirectionalLight) {
    component = (
      <DirectionalLightSettings
        className={cx('light-settings', className)}
        light={light}
        {...restProps}
      />
    )
  } else if (light instanceof PointLight) {
    component = (
      <PointLightSettings
        className={cx('light-settings', className)}
        light={light}
        {...restProps}
      />
    )
  } else if (light instanceof SpotLight) {
    component = (
      <SpotLightSettings
        className={cx('light-settings', className)}
        light={light}
        {...restProps}
      />
    )
  } else {
    component = <></>
  }

  return component
}

export default LightSettingsComponent
