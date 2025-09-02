// Shared utility functions for score-related operations

export const getScoreColor = (score: number) => {
  if (score >= 90) return 'from-emerald-500 to-emerald-600';
  if (score >= 75) return 'from-blue-500 to-blue-600';
  if (score >= 60) return 'from-yellow-500 to-yellow-600';
  return 'from-red-500 to-red-600';
};

export const getScoreColorWithBackground = (score: number) => {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

export const getScoreTextColor = (score: number) => {
  if (score >= 90) return 'text-emerald-700';
  if (score >= 75) return 'text-blue-700';
  if (score >= 60) return 'text-yellow-700';
  return 'text-red-700';
};

export const getScoreIcon = (score: number) => {
  if (score >= 90) return '🎯';
  if (score >= 75) return '📈';
  if (score >= 60) return '📊';
  return '📉';
};

export const getBenchmarkColor = (score: number, benchmark: { excellent: number; good: number; acceptable: number }) => {
  if (score >= benchmark.excellent) return 'bg-emerald-500';
  if (score >= benchmark.good) return 'bg-blue-500';
  if (score >= benchmark.acceptable) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getLevelIcon = (level: string) => {
  switch (level) {
    case 'expert': return '👑';
    case 'advanced': return '⭐';
    case 'intermediate': return '📈';
    case 'developing': return '🌱';
    default: return '🌱';
  }
};

export const getAudienceIcon = (audience: string) => {
  switch (audience) {
    case 'academic': return '🎓';
    case 'professional': return '💼';
    case 'general public': return '👥';
    case 'consumers': return '🛍️';
    default: return '👥';
  }
};

export const getDocumentTypeIcon = (type: string) => {
  switch (type) {
    case 'academic': return '🎓';
    case 'business': return '💼';
    case 'blog': return '📝';
    case 'marketing': return '📢';
    default: return '📄';
  }
};

export const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return '🔥';
    case 'medium': return '⚡';
    case 'low': return '💡';
  }
};

export const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return 'bg-red-50 border-red-200 text-red-800';
    case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
  }
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('text')) return '📄';
  return '📎';
};