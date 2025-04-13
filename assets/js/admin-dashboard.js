document.addEventListener('DOMContentLoaded', () => {

    // Manejar eliminación de chats
    document.querySelectorAll('.phoenix-delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const sessionId = button.dataset.sessionId;
        const row = button.closest('tr');
  
        if (confirm('¿Estás seguro de que quieres eliminar este chat? Esta acción no se puede deshacer.')) {
  
            const formData = new FormData();
            formData.append('action', 'phoenix_bulk_delete');
            formData.append('session_ids[]', sessionId);
            
            fetch(phoenixAdminDashboard.ajaxurl, {
              method: 'POST',
              body: formData
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
  
    // Función para mostrar notificación toast
    function showToast(message) {
      const toast = document.getElementById('phoenix-toast');
      if (!toast) return;
  
      toast.textContent = message;
      toast.style.display = 'block';
      toast.style.opacity = '1';
  
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 400);
      }, 2500);
    }
  
  });
  