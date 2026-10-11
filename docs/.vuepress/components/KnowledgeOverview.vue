<script setup lang="ts">
import { computed } from 'vue';
import { RouteLink } from 'vuepress/client';
import data from '@temp/knowledge.js';
const recent = computed(() => data.notes.filter((note) => note.updated !== null).slice(0, 5));
const date = (timestamp: number): string => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(timestamp);
</script>

<template>
  <section id="knowledge" class="knowledge-overview" aria-labelledby="knowledge-heading">
    <div class="section-heading"><span class="eyebrow">KNOWLEDGE BASE</span><h2 id="knowledge-heading">知识分类</h2><p>从一个问题出发，让零散的记录成为自己的知识。</p></div>
    <div class="category-grid">
      <RouteLink v-for="(category, index) in data.categories" :key="category.path" :to="category.path" class="category-card">
        <span class="category-icon" aria-hidden="true">{{ index === 0 ? '⌘' : '◈' }}</span>
        <span class="category-count">{{ category.count }} 篇笔记</span>
        <h3>{{ category.title }}</h3>
        <p>{{ category.children.join(' · ') || '学习笔记与工程实践' }}</p>
        <span class="category-enter">进入知识库 <span aria-hidden="true">→</span></span>
      </RouteLink>
    </div>
    <section v-if="recent.length" class="recent-notes" aria-labelledby="recent-heading">
      <div class="section-heading"><span class="eyebrow">KEEP LEARNING</span><h2 id="recent-heading">最近更新</h2><p>每一次记录，都让理解更进一步。</p></div>
      <ul class="recent-list"><li v-for="note in recent" :key="note.path"><RouteLink :to="note.path"><span class="recent-category">{{ note.category }}</span><span class="recent-title">{{ note.title }}</span><time v-if="note.updated" :datetime="new Date(note.updated).toISOString()">{{ date(note.updated) }}</time><span aria-hidden="true">↗</span></RouteLink></li></ul>
    </section>
  </section>
</template>
