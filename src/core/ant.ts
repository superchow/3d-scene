import { Button, Col, Row, message } from 'antd';

export const ANT_PREFIXCLS = process.env.REACT_APP_ANT_PREFIXCLS || 'sidus-3d'

Button.defaultProps = {
  prefixCls: `${ANT_PREFIXCLS}-btn`
}

message.config({
  prefixCls: `${ANT_PREFIXCLS}-message`
})

Row.defaultProps = {
  prefixCls: `${ANT_PREFIXCLS}-row`
}

Col.defaultProps = {
  prefixCls: `${ANT_PREFIXCLS}-col`
}