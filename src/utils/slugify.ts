// utils/slugify.ts
export function generateAdvogadoSlug(nome: string): string {
    return nome
      .toLowerCase()
      .trim()
      // Remove acentos
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Remove caracteres especiais, mantém apenas letras, números e espaços
      .replace(/[^a-z0-9\s]/g, '')
      // Substitui espaços por hífens
      .replace(/\s+/g, '-')
      // Remove hífens duplicados
      .replace(/-+/g, '-')
      // Remove hífens no início e fim
      .replace(/^-+|-+$/g, '');
  }
  
  // Função para reverter slug em nome (opcional)
  export function slugToName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Exemplos de uso:
  // generateAdvogadoSlug("Dr. Marcos Cintra") → "dr-marcos-cintra"
  // generateAdvogadoSlug("Dra. Maria José dos Santos") → "dra-maria-jose-dos-santos"
  // generateAdvogadoSlug("Dr. João Silva & Associados") → "dr-joao-silva-associados"