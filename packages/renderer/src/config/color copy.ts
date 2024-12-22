export interface ColorToken {
  '--td-brand-color': string;
  '--td-warning-color': string;
  '--td-error-color': string;
  '--td-success-color': string;
  [key: string]: string;
}

export const defaultLightColor: ColorToken = {
  '--td-brand-color': '#0052D9',
  '--td-warning-color': '#ED7B2F',
  '--td-error-color': '#E34D59',
  '--td-success-color': '#2BA471',
};

export const defaultDarkColor: ColorToken = {
  '--td-brand-color': '#5496FF',
  '--td-warning-color': '#ED7B2F',
  '--td-error-color': '#E34D59',
  '--td-success-color': '#2BA471',
};

export const colorList = {
  DEFAULT: '#0052D9',
  CYAN: '#0594FA',
  GREEN: '#00A870',
  ORANGE: '#ED7B2F',
  RED: '#E34D59',
};
