import Vector3Input, { Vector3InputValue } from '@/components/Vector3Input'
import { Color3, SpotLight, Tools, Vector3 } from '@babylonjs/core'
import { PBRCustomMaterial } from '@babylonjs/materials'
import { InputNumber, Slider, Switch } from 'antd'
import { Colorpicker } from 'antd-colorpicker'
import { SliderMarks } from 'antd/lib/slider'
import cx from 'classnames'
import { HTMLAttributes, useEffect, useState } from 'react'
import { Color, ColorResult } from 'react-color'
import './index.less'

export type SpotLightSettingsProps = {
  light: SpotLight
} & HTMLAttributes<HTMLDivElement>

const angleMarks: SliderMarks = {
  0: '0°',
  45: '45°',
  90: '90°',
  135: '135°',
  180: '180°',
}

const SpotLightSettings = (props: SpotLightSettingsProps) => {
  const { light, className, ...restProps } = props

  const [enable, setLightEnable] = useState<boolean>(light.isEnabled())
  useEffect(() => {
    if (light.isEnabled() !== enable) {
      light.setEnabled(enable)
    }
  }, [enable, light])

  const [direction, setDirection] = useState<Vector3InputValue>(
    light.direction.asArray(),
  )
  const onDirectionChangeMethod = (value: Vector3InputValue) => {
    setDirection(value)
    light.direction = new Vector3(value[0], value[1], value[2])
  }
  useEffect(() => {
    console.log(light.direction)
    setDirection(light.direction.asArray())
  }, [light.direction])

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

  const [angle, setAngle] = useState(Tools.ToDegrees(light.angle))
  const onAngleChangeMethod = (value: number) => {
    setAngle(value)
    // 弧度
    const radians = Tools.ToRadians(angle)
    light.angle = radians
  }
  useEffect(() => {}, [angle])

  const [range, setRange] = useState(light.range)
  const onRangeChangeMethod = (value: number | null) => {
    setRange(value || Infinity)
    light.range = value || Infinity
  }

  return (
    <div className={cx('spotLight-settings', className)} {...restProps}>
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
          <Vector3Input value={direction} onChange={onDirectionChangeMethod} />
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
        <label>
          <span>angle</span>
          <Slider
            className='flex-auto'
            marks={angleMarks}
            min={0}
            max={180}
            value={angle}
            onChange={onAngleChangeMethod}
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

export default SpotLightSettings
