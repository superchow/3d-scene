import Vector3Input from '@/components/Vector3Input'
import { Color3, DirectionalLight, Vector3 } from '@babylonjs/core'
import { Switch } from 'antd'
import { Colorpicker } from 'antd-colorpicker'
import cx from 'classnames'
import { HTMLAttributes, useEffect, useState } from 'react'
import { Color, ColorResult } from 'react-color'
import './index.less'

export type DirectionalLightSettingsProps = {
  light: DirectionalLight
} & HTMLAttributes<HTMLDivElement>

const DirectionalLightSettings = (porps: DirectionalLightSettingsProps) => {
  const { light, className, ...restProps } = porps
  const [enable, setLightEnable] = useState<boolean>(light.isEnabled())

  const [diffuseColor, setDiffuseColor] = useState<Color>(
    light.diffuse.toHexString(),
  )
  const onDiffuseChangeMethod = (color: ColorResult) => {
    setDiffuseColor(color.hex)
    light.diffuse = Color3.FromHexString(color.hex)
  }
  useEffect(() => {
    setDiffuseColor(light.diffuse.toHexString())
  }, [light.diffuse])

  const [specularColor, setSpecularColor] = useState<Color>(
    light.specular.toHexString(),
  )
  const onSpecularChangeMethod = (color: ColorResult) => {
    setSpecularColor(color.hex)
    light.specular = Color3.FromHexString(color.hex)
  }
  useEffect(() => {
    setSpecularColor(light.specular.toHexString())
  }, [light.specular])

  useEffect(() => {
    if (light.isEnabled() !== enable) {
      light.setEnabled(enable)
    }
  }, [enable, light])

  return (
    <div className={cx('directionalLight-settings', className)} {...restProps}>
       <div className='settings-group'>
        <label>
          <span>开/关</span>
          <Switch
            checkedChildren='开启'
            unCheckedChildren='关闭'
            checked={enable}
            onChange={setLightEnable}
          />
        </label>
      </div>
      <div className='settings-group'>
        <label>
          <span>方向</span>
          <Vector3Input
            value={light.direction.asArray()}
            onChange={(val) => {
              light.direction = new Vector3(val[0], val[1], val[2])
            }}
          />
        </label>

        <label>
          <span>漫反射光</span>
          <Colorpicker
            value={diffuseColor}
            onChange={onDiffuseChangeMethod}
            popup
          />
        </label>
        <label>
          <span>高亮光</span>
          <Colorpicker
            value={specularColor}
            onChange={onSpecularChangeMethod}
            popup
          />
        </label>
      </div>
    </div>
  )
}

export default DirectionalLightSettings
