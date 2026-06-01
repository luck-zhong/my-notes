import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: '嵌入式',
      items: [
        'embedded/stm32',
      ],
    },
    {
      type: 'category',
      label: '光模块',
      items: [
        'optical-module/cmis'
      ],
    },
  ],
};

export default sidebars;