document.addEventListener('DOMContentLoaded', () => {

    // Eliminar chat con confirmación
    document.querySelectorAll('.phoenix-delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const sessionId = button.dataset.sessionId;
        const row = button.closest('tr');
  
        if (confirm('¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.')) {
          fetch(phoenixAdminDashboard.ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'phoenix_bulk_delete',
                'session_ids[]': sessionId
              })              
          })
          .then(res => res.json())
          .then(response => {
            if (response.success) {
              row.remove();
            } else {
              alert('Error al eliminar el chat.');
            }
          });
        }
      });
    });
  });
  