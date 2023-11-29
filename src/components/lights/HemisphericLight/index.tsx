import Vector3Input from '@/components/Vector3Input'
import { Color3, HemisphericLight, Vector3 } from '@babylonjs/core'
import { Switch } from 'antd'
import { Colorpicker } from 'antd-colorpicker'
import cx from 'classnames'
import { HTMLAttributes, useEffect, useState } from 'react'
import { Color, ColorResult } from 'react-color'
import './index.less'

export type HemisphericLightSettingsProps = {
  light: HemisphericLight
} & HTMLAttributes<HTMLDivElement>

const HemisphericLightSettings = (props: HemisphericLightSettingsProps) => {
  const { light, className, ...restProps } = props

  const [enable, setLightEnable] = useState<boolean>(light.isEnabled())
  useEffect(() => {
    if (light.isEnabled() !== enable) {
      light.setEnabled(enable)
    }
  }, [enable, light])

  const [groundColor, setGroundColor] = useState<Color>(
    light.groundColor.toHexString(),
  )
  const onGroundColorChangeMethod = (color: ColorResult) => {
    setGroundColor(color.hex)
    light.groundColor = Color3.FromHexString(color.hex)
  }
  useEffect(() => {
    setGroundColor(light.groundColor.toHexString())
  }, [light.groundColor])

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


  return (
    <div className={cx('hemisphericLight-settings', className)} {...restProps}>
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
          <span>地面色</span>
          <Colorpicker
            value={groundColor}
            onChange={onGroundColorChangeMethod}
            popup
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

export default HemisphericLightSettings
