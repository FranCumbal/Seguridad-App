import type { ThemeConfig } from 'antd';

export const corporateTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    colorText: '#262626',
    colorTextSecondary: '#595959',
    colorTextTertiary: '#8c8c8c',
    colorTextQuaternary: '#bfbfbf',
    colorSuccess: '#52c41a',
    colorWarning: '#d97706',
    colorError: '#ff4d4f',
    colorInfo: '#4096ff',

    fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    lineHeight: 1.6,

    boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
    boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.08)',

    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      triggerBg: '#fafafa',
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: '#595959',
      itemSelectedBg: 'rgba(22,119,255,0.08)',
      itemSelectedColor: '#1677ff',
      itemHoverBg: '#f5f5f5',
      itemHoverColor: '#262626',
      itemActiveBg: 'rgba(22,119,255,0.08)',
    },
    Card: {
      colorBgContainer: '#ffffff',
      colorBorderSecondary: '#f0f0f0',
    },
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#fafafa',
      rowHoverBg: 'rgba(22,119,255,0.04)',
      borderColor: '#f0f0f0',
    },
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
    },
    Drawer: {
      colorBgElevated: '#ffffff',
    },
    Input: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9',
      activeBorderColor: '#1677ff',
      hoverBorderColor: '#4096ff',
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9',
      optionSelectedBg: 'rgba(22,119,255,0.08)',
    },
    DatePicker: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9',
    },
    Button: {
      defaultBg: '#ffffff',
      defaultBorderColor: '#d9d9d9',
      defaultColor: '#595959',
    },
    Tabs: {
      colorBorderSecondary: '#d9d9d9',
      itemColor: '#595959',
      itemSelectedColor: '#1677ff',
      inkBarColor: '#1677ff',
      itemHoverColor: '#262626',
    },
    Tag: {
      defaultBg: '#f5f5f5',
      defaultColor: '#595959',
    },
    Badge: {},
    Divider: {
      colorSplit: '#f0f0f0',
    },
    Statistic: {
      colorTextDescription: '#8c8c8c',
    },
    Form: {
      labelColor: '#595959',
      labelFontSize: 13,
    },
    Switch: {
      colorPrimary: '#1677ff',
    },
    Upload: {
      colorBgContainer: '#fafafa',
      colorBorder: '#d9d9d9',
    },
  },
};