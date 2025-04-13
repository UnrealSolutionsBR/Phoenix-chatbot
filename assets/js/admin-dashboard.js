document.addEventListener('DOMContentLoaded', () => {
    // Botón de eliminar
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
              showToast('Chat eliminado con éxito');
            } else {
              alert('Error al eliminar el chat.');
            }
          });
        }
      });
    });
  
    // Función para mostrar el toast
    function showToast(message) {
      const toast = document.getElementById('phoenix-toast');
      if (!toast) return;
  
      toast.textContent = message;
      toast.style.display = 'block';
  
      setTimeout(() => {
        toast.style.opacity = '1';
      }, 10);
  
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 400);
      }, 2500);
    }
  });
  