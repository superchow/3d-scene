import LightSettingsComponent, {
  LightSettingsComponentProps,
} from './LightSettingsComponent'
import LightsSettingsComponent, {
  LightsSettingsComponentProps,
} from './LightsSettingsComponent'
import HemisphericLightSettings, {
  HemisphericLightSettingsProps,
} from './HemisphericLight'
import DirectionalLightSettings, {
  DirectionalLightSettingsProps,
} from './DirectionalLight'
import PointLightSettings, { PointLightSettingsProps } from './PointLight'
import SpotLightSettings, { SpotLightSettingsProps } from './SpotLight'

export {
  LightsSettingsComponent,
  LightSettingsComponent,
  HemisphericLightSettings as HemisphericLightSettingsComponent,
  DirectionalLightSettings as DirectionalLightSettingsComponent,
  PointLightSettings as PointLightSettingsComponent,
  SpotLightSettings as SpotLightSettingsComponent,
}

export type {
  LightsSettingsComponentProps,
  LightSettingsComponentProps,
  HemisphericLightSettingsProps,
  DirectionalLightSettingsProps,
  PointLightSettingsProps,
  SpotLightSettingsProps,
}
