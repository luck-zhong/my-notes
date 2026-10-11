declare module '@temp/knowledge.js' {
  const data: {
    notes: { source: string; title: string; path: string; category: string; updated: number | null }[];
    categories: { title: string; path: string; count: number; children: string[] }[];
  };
  export default data;
}
