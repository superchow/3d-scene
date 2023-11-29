import { ANT_PREFIXCLS } from '@/core/ant'
import { ConfigProvider } from 'antd'
import { Locale } from 'antd/lib/locale-provider'
import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import reportWebVitals from './reportWebVitals'
const resources: Record<string, Locale> = {
  zh: zhCN,
  en: enUS,
}
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <ConfigProvider
      prefixCls={ANT_PREFIXCLS}
      locale={resources['zh']}
      autoInsertSpaceInButton={false}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
