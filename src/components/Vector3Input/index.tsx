import { Col, Input, InputNumber, InputNumberProps, Row } from 'antd'
import cx from 'classnames'
import { HTMLAttributes, useEffect, useState } from 'react'
import './index.less'

/** 空间坐标 */
export type Vector3InputValue =
  | [number | undefined, number | undefined, number | undefined]
  | [number | undefined, number | undefined]
  | [number | undefined]
  | number[]

export type Vector3InputProps = {
  value?: Vector3InputValue
  defaultValue?: Vector3InputValue
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
  minZ?: number
  maxZ?: number
  onChange?: (value: Vector3InputValue) => void
} & Pick<
  InputNumberProps,
  'size' | 'readOnly' | 'disabled' | 'stringMode' | 'controls' | 'status'
> &
  Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>

/**
 * 空间坐标输入框
 * @param props
 * @returns
 */
function Vector3Input(props: Vector3InputProps) {
  const {
    value,
    defaultValue,
    onChange,
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    className,
    size,
    readOnly,
    disabled,
    stringMode,
    controls,
    status,
    ...restProps
  } = props

  const [coordinate, setCoordinate] = useState<Vector3InputValue>(
    value || defaultValue || [undefined],
  )

  const onCoordinateChangeMethod = (list: Vector3InputValue) => {
    setCoordinate(list)
    const [x, y, z] = value || []
    const [X, Y, Z] = list
    if (x !== X || y !== Y || z !== Z) {
      onChange && onChange(list)
    }
  }

  useEffect(() => {
    setCoordinate(value || [])
  }, [value])

  return (
    <Input.Group className={cx('coordinate-input', className)} {...restProps}>
      <Row gutter={6} align='middle'>
        <Col span={2} className='coordinate-input-label'>
          X
        </Col>
        <Col span={6}>
          <InputNumber
            className='coordinate-input-area'
            min={minX}
            max={maxX}
            value={coordinate[0]}
            size={size}
            readOnly={readOnly}
            disabled={disabled}
            stringMode={stringMode}
            controls={controls}
            onChange={(val) =>
              onCoordinateChangeMethod([val || 0, coordinate[1], coordinate[2]])
            }
          />
        </Col>
        <Col span={2} className='coordinate-input-label'>
          Y
        </Col>
        <Col span={6}>
          <InputNumber
            className='coordinate-input-area'
            min={minY}
            max={maxY}
            value={coordinate[1]}
            size={size}
            readOnly={readOnly}
            disabled={disabled}
            stringMode={stringMode}
            controls={controls}
            onChange={(val) =>
              onCoordinateChangeMethod([coordinate[0], val || 0, coordinate[2]])
            }
          />
        </Col>
        <Col span={2} className='coordinate-input-label'>
          Z
        </Col>
        <Col span={6}>
          <InputNumber
            className='coordinate-input-area'
            min={minZ}
            max={maxZ}
            value={coordinate[2]}
            size={size}
            readOnly={readOnly}
            disabled={disabled}
            stringMode={stringMode}
            controls={controls}
            onChange={(val) =>
              onCoordinateChangeMethod([coordinate[0], coordinate[1], val || 0])
            }
          />
        </Col>
      </Row>
    </Input.Group>
  )
}

export default Vector3Input
