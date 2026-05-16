import type { ThemeConfig } from 'antd';

export const corporateTheme: ThemeConfig = {
  token: {
    // Colores primarios corporativos
    colorPrimary: '#1677ff',
    colorBgBase: '#0d1117',
    colorBgContainer: '#161b22',
    colorBgElevated: '#1c2128',
    colorBgLayout: '#0d1117',
    colorBorder: '#30363d',
    colorBorderSecondary: '#21262d',
    colorText: '#e6edf3',
    colorTextSecondary: '#8b949e',
    colorTextTertiary: '#6e7681',
    colorTextQuaternary: '#484f58',
    colorSuccess: '#3fb950',
    colorWarning: '#d29922',
    colorError: '#f85149',
    colorInfo: '#58a6ff',

    // Tipografía
    fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,

    // Radios y espaciado
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    lineHeight: 1.6,

    // Sombras
    boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.24)',
    boxShadowSecondary: '0 3px 6px rgba(0,0,0,0.3), 0 3px 6px rgba(0,0,0,0.25)',

    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      siderBg: '#0d1117',
      triggerBg: '#161b22',
      headerBg: '#0d1117',
      bodyBg: '#0d1117',
    },
    Menu: {
      darkItemBg: '#0d1117',
      darkSubMenuItemBg: '#0a0f14',
      darkItemColor: '#8b949e',
      darkItemSelectedBg: 'rgba(22,119,255,0.15)',
      darkItemSelectedColor: '#58a6ff',
      darkItemHoverBg: 'rgba(255,255,255,0.05)',
      darkItemHoverColor: '#e6edf3',
    },
    Card: {
      colorBgContainer: '#161b22',
      colorBorderSecondary: '#21262d',
    },
    Table: {
      colorBgContainer: '#161b22',
      headerBg: '#1c2128',
      rowHoverBg: 'rgba(22,119,255,0.08)',
      borderColor: '#21262d',
    },
    Modal: {
      contentBg: '#1c2128',
      headerBg: '#1c2128',
      footerBg: '#1c2128',
    },
    Drawer: {
      colorBgElevated: '#1c2128',
    },
    Input: {
      colorBgContainer: '#1c2128',
      colorBorder: '#30363d',
      activeBorderColor: '#1677ff',
      hoverBorderColor: '#388bfd',
    },
    Select: {
      colorBgContainer: '#1c2128',
      colorBorder: '#30363d',
      optionSelectedBg: 'rgba(22,119,255,0.15)',
    },
    DatePicker: {
      colorBgContainer: '#1c2128',
      colorBorder: '#30363d',
    },
    Button: {
      defaultBg: '#21262d',
      defaultBorderColor: '#30363d',
      defaultColor: '#c9d1d9',
    },
    Tabs: {
      colorBorderSecondary: '#30363d',
      itemColor: '#8b949e',
      itemSelectedColor: '#58a6ff',
      inkBarColor: '#1677ff',
      itemHoverColor: '#e6edf3',
    },
    Tag: {
      defaultBg: '#21262d',
      defaultColor: '#8b949e',
    },
    Badge: {},
    Divider: {
      colorSplit: '#21262d',
    },
    Statistic: {
      colorTextDescription: '#8b949e',
    },
    Form: {
      labelColor: '#8b949e',
      labelFontSize: 13,
    },
    Switch: {
      colorPrimary: '#1677ff',
    },
    Upload: {
      colorBgContainer: '#1c2128',
      colorBorder: '#30363d',
    },
  },
};
