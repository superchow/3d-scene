import { Color3, PointLight } from '@babylonjs/core'
import { PBRCustomMaterial } from '@babylonjs/materials'
import { InputNumber, Switch } from 'antd'
import { Colorpicker } from 'antd-colorpicker'
import cx from 'classnames'
import { HTMLAttributes, useEffect, useState } from 'react'
import { Color, ColorResult } from 'react-color'
import './index.less'

export type PointLightSettingsProps = {
  light: PointLight
} & HTMLAttributes<HTMLDivElement>

const PointLightSettings = (props: PointLightSettingsProps) => {
  const { light, className, ...restProps } = props

  const [enable, setLightEnable] = useState<boolean>(light.isEnabled())
  useEffect(() => {
    if (light.isEnabled() !== enable) {
      light.setEnabled(enable)
    }
  }, [enable, light])

  const [diffuseColor, setDiffuseColor] = useState<Color>(
    light.diffuse.toHexString(),
  )
  const onDiffuseChangeMethod = (color: ColorResult) => {
    setDiffuseColor(color.hex)
    light.diffuse = Color3.FromHexString(color.hex)
  }
  useEffect(() => {
    setDiffuseColor(light.diffuse.toHexString())
    if (light.metadata?.linkMesh && light.metadata?.linkMesh.material) {
      ;(light.metadata?.linkMesh.material as PBRCustomMaterial).emissiveColor =
        light.diffuse
    }
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

  const [range, setRange] = useState(light.range)
  const onRangeChangeMethod = (value: number | null) => {
    setRange(value || Infinity)
    light.range = value || Infinity
  }

  return (
    <div className={cx('pointLight-settings', className)} {...restProps}>
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
        <label>
          <span>range</span>
          <InputNumber
            min={0}
            value={range}
            controls={false}
            onChange={onRangeChangeMethod}
          />
        </label>
      </div>
    </div>
  )
}

export default PointLightSettings
