// Navegação personalizada para a aplicação
const menuItems = {
  items: [
    {
      id: 'navigation',
      title: 'Navigation',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        { id: 'dashboard', title: 'Dashboard', type: 'item', icon: 'material-icons-two-tone', iconname: 'home', url: '/dashboard' },
        { id: 'create', title: 'Criar', type: 'item', icon: 'material-icons-two-tone', iconname: 'add_circle', url: '/create' },

        {
          id: 'channels',
          title: 'Canais',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'work',
          children: [
            { id: 'channels', title: 'Todos os canais', type: 'item', url: '/channels' }
          ]
        },
        {
          id: 'jobs',
          title: 'Jobs',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'send',
          children: [
            { id: 'jobs', title: 'Fila de Jobs', type: 'item', url: '/jobs' }
          ]
        },

        { id: 'publications', title: 'Publicações', type: 'item', icon: 'material-icons-two-tone', iconname: 'publish', url: '/publications' },
        { id: 'gallery', title: 'Galeria', type: 'item', icon: 'material-icons-two-tone', iconname: 'photo_library', url: '/galeria' },

        {
          id: 'analytics',
          title: 'Analytics',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'insights',
          children: [
            { id: 'analytics', title: 'Visão Geral', type: 'item', url: '/analytics' },
            { id: 'compare', title: 'Comparar', type: 'item', url: '/analytics/compare' },
            { id: 'videos', title: 'Vídeos', type: 'item', url: '/analytics/videos' },
            { id: 'ab-tests', title: 'AB Tests', type: 'item', url: '/analytics/ab-tests' }
          ]
        },

        {
          id: 'posts',
          title: 'Posts',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'post_add',
          children: [
            { id: 'new', title: 'Novo Post', type: 'item', url: '/posts/new' },
            { id: 'queue', title: 'Fila de Posts', type: 'item', url: '/posts/queue' }
          ]
        },

        {
          id: 'composer',
          title: 'Composer',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'draw',
          children: [
            { id: 'composer', title: 'Lista', type: 'item', url: '/composer' },
            { id: 'composer-new', title: 'Novo', type: 'item', url: '/composer/new' }
          ]
        },

        {
          id: 'calendar',
          title: 'Calendário',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'event',
          children: [
            { id: 'calendar', title: 'Agenda', type: 'item', url: '/calendar' },
            { id: 'calendar-list', title: 'Lista', type: 'item', url: '/calendar/list' }
          ]
        },

        {
          id: 'alerts',
          title: 'Alertas & Inbox',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'notifications',
          children: [
            { id: 'inbox', title: 'Inbox', type: 'item', url: '/inbox' },
            { id: 'alertas', title: 'Alertas', type: 'item', url: '/alerts' }
          ]
        },

        { id: 'accounts', title: 'Contas', type: 'item', icon: 'material-icons-two-tone', iconname: 'account_circle', url: '/accounts' },
        { id: 'assets', title: 'Biblioteca de Assets', type: 'item', icon: 'material-icons-two-tone', iconname: 'inventory_2', url: '/assets' },
        { id: 'characters', title: 'Personagens', type: 'item', icon: 'material-icons-two-tone', iconname: 'face', url: '/characters' },
        { id: 'story', title: 'Planejamento de História', type: 'item', icon: 'material-icons-two-tone', iconname: 'movie', url: '/story' },
        { id: 'assistant', title: 'Assistente', type: 'item', icon: 'material-icons-two-tone', iconname: 'smart_toy', url: '/assistant' },
        { id: 'monitoring', title: 'Monitoramento', type: 'item', icon: 'material-icons-two-tone', iconname: 'monitor_heart', url: '/monitoring' },

        {
          id: 'settings',
          title: 'Configurações',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'settings',
          children: [
            { id: 'settings-home', title: 'Geral', type: 'item', url: '/settings' },
            { id: 'integrations', title: 'Integrações', type: 'item', url: '/settings/integrations' },
            { id: 'ai', title: 'AI', type: 'item', url: '/settings/ai' },
            { id: 'notifications', title: 'Notificações', type: 'item', url: '/settings/notifications' },
            { id: 'preferences', title: 'Preferências', type: 'item', url: '/settings/preferences' },
            { id: 'security', title: 'Segurança', type: 'item', url: '/settings/security' },
            { id: 'logs', title: 'Logs', type: 'item', url: '/settings/logs' },
            { id: 'transcoder', title: 'Transcoder', type: 'item', url: '/settings/transcoder' },
            { id: 'providers', title: 'Providers', type: 'item', url: '/settings/providers' }
          ]
        },

        { id: 'perfil', title: 'Meu Perfil', type: 'item', icon: 'material-icons-two-tone', iconname: 'person', url: '/perfil' }
      ]
    }
  ]
};

export default menuItems;
