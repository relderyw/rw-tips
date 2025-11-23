(function() {
    // ADMIN BYPASS: Verifica URL ou LocalStorage
    // Chave: ?radar_sys_admin_x92=true
    // Changed to check href because HashRouter puts params after the hash (just in case, though this is vanilla JS)
    const isAdmin = window.location.href.includes('radar_sys_admin_x92=true') || localStorage.getItem('rw_radar_master') === 'true';
    
    if (isAdmin) {
        // Salva que é admin para não precisar digitar o código sempre
        localStorage.setItem('rw_radar_master', 'true');
        return;
    }

    // 1. Bloquear Botão Direito
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });

    // 2. Bloquear Atalhos de Teclado (F12, Ctrl+Shift+I, etc)
    document.addEventListener('keydown', function(e) {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Ctrl+Shift+I, J, C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
      }
      // Ctrl+U (Ver Código Fonte)
      if (e.ctrlKey && e.key === 'U') {
        e.preventDefault();
      }
    });

    // 3. Armadilha de Debugger
    // Pausa a execução se o DevTools estiver aberto
    setInterval(function() {
      (function() {
        debugger;
      })();
    }, 1000);
})();
