import { defineClientConfig } from 'vuepress/client';
import KnowledgeOverview from './components/KnowledgeOverview.vue';

export default defineClientConfig({
  enhance({ app, router }) {
    app.component('KnowledgeOverview', KnowledgeOverview);
    // Vue Router calculates its own scroll position; CSS scroll-margin alone
    // does not offset those jumps beneath the fixed Hope navbar.
    router.options.scrollBehavior = (to, _from, savedPosition) => {
      if (savedPosition) return savedPosition;
      return to.hash ? { el: to.hash, top: 80 } : { top: 0 };
    };
  },
});
